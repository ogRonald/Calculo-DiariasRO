using DiariasRO.api.Data;
using DiariasRO.Domain.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
        await _db.Database.EnsureCreatedAsync();

        // 1. Cria a tabela de Usuarios primeiro
        await _db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS Usuarios (
                Id VARCHAR(36) NOT NULL PRIMARY KEY,
                Nome TEXT NOT NULL,
                Email TEXT NOT NULL
            );");

        // 2. Cria a tabela Historicos referenciando Usuarios
        await _db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS Historicos (
                Id VARCHAR(36) NOT NULL PRIMARY KEY, 
                UsuarioId VARCHAR(36) NOT NULL, 
                Destino TEXT NOT NULL, 
                DataHoraInicio TIMESTAMP NOT NULL, 
                DataHoraFim TIMESTAMP NOT NULL, 
                TotalDias INT NOT NULL, 
                ValorUnitarioBrl NUMERIC(18,2) NOT NULL, 
                ValorTotalBrl NUMERIC(18,2) NOT NULL, 
                CriadoEm TIMESTAMP NOT NULL, 
                CONSTRAINT FK_Historicos_Usuarios_UsuarioId FOREIGN KEY (UsuarioId) REFERENCES Usuarios (Id) ON DELETE CASCADE
            );");

        // 3. Cria o índice
        await _db.Database.ExecuteSqlRawAsync(@"
            CREATE INDEX IF NOT EXISTS IX_Historicos_UsuarioId ON Historicos (UsuarioId);
        ");
    }
}