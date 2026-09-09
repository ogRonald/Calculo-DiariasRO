using DiariasRO.Domain.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<CalculadorDiariasService>();

// 1. CORS Totalmente Aberto (Ideal para desenvolvimento local)
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 2. ORDEM ESTRITA DE EXECUÇÃO
app.UseRouting(); 
app.UseCors("PermitirFrontend");
app.UseAuthorization();
app.MapControllers();

app.Run();