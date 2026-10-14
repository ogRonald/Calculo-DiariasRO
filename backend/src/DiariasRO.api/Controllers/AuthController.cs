using DiariasRO.api.Data;
using DiariasRO.api.Dtos;
using DiariasRO.api.Models;
using DiariasRO.api.Services; // 1. Adicionado para usar o TokenService
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiariasRO.api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly DiariasDbContext _db;
    private readonly IConfiguration _config; // 2. Adicionado para ler as configurações do appsettings.json
    private readonly PasswordHasher<Usuario> _passwordHasher = new();

    // 3. IConfiguration injetado no construtor
    public AuthController(DiariasDbContext db, IConfiguration config) 
    {
        _db = db;
        _config = config;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Matricula) ||
            string.IsNullOrWhiteSpace(dto.Senha) ||
            string.IsNullOrWhiteSpace(dto.Orgao))
        {
            return BadRequest(new { erro = "Preencha a matrícula, a senha e o órgão/instituição." });
        }

        var matricula = dto.Matricula.Trim();
        var orgao = dto.Orgao.Trim();
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Matricula == matricula);

        // Para o protótipo da faculdade, o primeiro acesso cria o usuário.
        // Nos acessos seguintes, a senha é validada normalmente.
        if (usuario is null)
        {
            usuario = new Usuario
            {
                Matricula = matricula,
                Orgao = orgao,
                SenhaHash = _passwordHasher.HashPassword(null!, dto.Senha),
                NivelAcesso = NivelAcesso.Operador // FASE 2: Garantimos que quem entra pela 1ª vez é Operador
            };

            _db.Usuarios.Add(usuario);
            await _db.SaveChangesAsync();
        }
        else
        {
            if (!string.Equals(usuario.Orgao, orgao, StringComparison.OrdinalIgnoreCase))
                return Unauthorized(new { erro = "A matrícula não está vinculada ao órgão/instituição informado." });

            var resultado = _passwordHasher.VerifyHashedPassword(usuario, usuario.SenhaHash, dto.Senha);
            if (resultado == PasswordVerificationResult.Failed)
                return Unauthorized(new { erro = "Matrícula ou senha inválida." });
        }

        // ==========================================
        // FASE 2: GERAÇÃO DO TOKEN JWT
        // ==========================================
        var token = TokenService.GerarToken(usuario, _config);

        // Devolvemos um objeto que contém o token de segurança e os dados do utilizador
        return Ok(new 
        { 
            token = token, 
            usuario = ToPerfil(usuario) 
        });
    }

    private static PerfilDto ToPerfil(Usuario usuario) => new(
        usuario.Id,
        usuario.Matricula,
        usuario.Orgao,
        usuario.NomeCompleto,
        usuario.Funcao,
        usuario.Email,
        usuario.Celular
    );
}