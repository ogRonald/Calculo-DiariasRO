using DiariasRO.api.Data;
using DiariasRO.Domain.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Insira o token JWT desta forma: Bearer {seu_token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Ajustado de SeuDbContext para DiariasDbContext
builder.Services.AddDbContext<DiariasDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<CalculadorDiariasService>();

// Cria o banco 
builder.Services.AddScoped<DatabaseInitializer>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});


// ... outras configurações do builder ...

// 1. Lendo as configurações do appsettings.json
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is missing");
var key = Encoding.ASCII.GetBytes(jwtKey);

// 2. Configurando a Autenticação
builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false; // Em produção (HTTPS), mude para true
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"]
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var initializer = scope.ServiceProvider.GetRequiredService<DatabaseInitializer>();
    await initializer.InitializeAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.UseCors("PermitirFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

public sealed class DatabaseInitializer
{
    private readonly DiariasDbContext _db;

    public DatabaseInitializer(DiariasDbContext db)
    {
        _db = db;
    }

    public async Task InitializeAsync()
    {
        // Aplica todas as Migrations do EF Core na ordem correta (cria tabelas e todas as colunas atualizadas)
        var migrations = _db.Database.GetMigrations();
        if (migrations.Any())
        {
            await _db.Database.MigrateAsync();
        }
        else
        {
            await _db.Database.EnsureCreatedAsync();
        }

        // Garante que as colunas novas existam mesmo se o banco foi criado antes das migrations
        await _db.Database.ExecuteSqlRawAsync(@"
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Usuarios') THEN
                    ALTER TABLE ""Usuarios"" ADD COLUMN IF NOT EXISTS ""NivelAcesso"" text NOT NULL DEFAULT 'Servidor';
                    ALTER TABLE ""Usuarios"" ADD COLUMN IF NOT EXISTS ""Matricula"" text NOT NULL DEFAULT '';
                    ALTER TABLE ""Usuarios"" ADD COLUMN IF NOT EXISTS ""Orgao"" text NOT NULL DEFAULT '';
                    ALTER TABLE ""Usuarios"" ADD COLUMN IF NOT EXISTS ""Funcao"" text NOT NULL DEFAULT '';
                    ALTER TABLE ""Usuarios"" ADD COLUMN IF NOT EXISTS ""Celular"" text NOT NULL DEFAULT '';
                    ALTER TABLE ""Usuarios"" ADD COLUMN IF NOT EXISTS ""DeveTrocarSenha"" boolean NOT NULL DEFAULT false;
                END IF;

                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Historicos') THEN
                    ALTER TABLE ""Historicos"" ADD COLUMN IF NOT EXISTS ""NomeBeneficiario"" text NOT NULL DEFAULT '';
                    ALTER TABLE ""Historicos"" ADD COLUMN IF NOT EXISTS ""MatriculaBeneficiario"" text NOT NULL DEFAULT '';
                    ALTER TABLE ""Historicos"" ADD COLUMN IF NOT EXISTS ""OrgaoBeneficiario"" text NOT NULL DEFAULT '';
                    ALTER TABLE ""Historicos"" ADD COLUMN IF NOT EXISTS ""Status"" integer NOT NULL DEFAULT 0;
                    ALTER TABLE ""Historicos"" ADD COLUMN IF NOT EXISTS ""MotivoDevolucao"" text NULL;
                    ALTER TABLE ""Historicos"" ADD COLUMN IF NOT EXISTS ""GestorAprovadorId"" uuid NULL;
                    ALTER TABLE ""Historicos"" ADD COLUMN IF NOT EXISTS ""DataAprovacao"" timestamp without time zone NULL;
                END IF;
            END
            $$;
        ");
    }
}