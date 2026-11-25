using DiariasRO.api.Data;
using DiariasRO.api.Dtos;
using DiariasRO.api.Models;
using DiariasRO.api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiariasRO.api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly DiariasDbContext _db;
    private readonly IConfiguration _config;
    private readonly PasswordHasher<Usuario> _passwordHasher = new();

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
        var matriculaAdminMestre = _config["Admin:Matricula"] ?? "0000001";

        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Matricula == matricula);

        if (usuario is null)
        {
            var existeAlgumAdmin = await _db.Usuarios.AnyAsync(u => u.NivelAcesso == NivelAcesso.Admin);
            var ehAdminInicial = !existeAlgumAdmin && matricula == matriculaAdminMestre;

            usuario = new Usuario
            {
                Matricula = matricula,
                Orgao = orgao,
                SenhaHash = _passwordHasher.HashPassword(null!, dto.Senha),
                NivelAcesso = ehAdminInicial ? NivelAcesso.Admin : NivelAcesso.Operador
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

            // Garante que a matrícula mestre receba Admin caso ainda não exista nenhum Admin no banco
            if (matricula == matriculaAdminMestre && usuario.NivelAcesso != NivelAcesso.Admin)
            {
                var existeAlgumAdmin = await _db.Usuarios.AnyAsync(u => u.NivelAcesso == NivelAcesso.Admin);
                if (!existeAlgumAdmin)
                {
                    usuario.NivelAcesso = NivelAcesso.Admin;
                    await _db.SaveChangesAsync();
                }
            }
        }

        var token = TokenService.GerarToken(usuario, _config);

        return Ok(new
        {
            token,
            usuario = new
            {
                usuario.Id,
                usuario.Matricula,
                usuario.Orgao,
                usuario.NomeCompleto,
                usuario.Funcao,
                usuario.Email,
                usuario.Celular,
                NivelAcesso = usuario.NivelAcesso.ToString(),
                Role = usuario.NivelAcesso.ToString()
            }
        });
    }
}