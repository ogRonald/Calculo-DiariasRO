using System.Security.Claims;
using DiariasRO.api.Data;
using DiariasRO.api.Dtos;
using DiariasRO.api.Models;
using DiariasRO.api.Services;
using Microsoft.AspNetCore.Authorization;
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

    public record TrocarSenhaObrigatoriaDto(string NovaSenha);

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
                NivelAcesso = ehAdminInicial ? NivelAcesso.Admin : NivelAcesso.Operador,
                DeveTrocarSenha = false
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
                usuario.DeveTrocarSenha,
                NivelAcesso = usuario.NivelAcesso.ToString(),
                Role = usuario.NivelAcesso.ToString()
            }
        });
    }

    [Authorize]
    [HttpPost("trocar-senha-obrigatoria")]
    public async Task<IActionResult> TrocarSenhaObrigatoria([FromBody] TrocarSenhaObrigatoriaDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NovaSenha) || dto.NovaSenha.Trim().Length < 6)
            return BadRequest(new { erro = "A nova senha deve ter no mínimo 6 caracteres." });

        if (dto.NovaSenha.Trim() == "SICADI@2026")
            return BadRequest(new { erro = "A nova senha não pode ser igual à senha temporária padrão." });

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var usuarioId))
            return Unauthorized(new { erro = "Sessão inválida." });

        var usuario = await _db.Usuarios.FindAsync(usuarioId);
        if (usuario is null)
            return NotFound(new { erro = "Usuário não encontrado." });

        usuario.SenhaHash = _passwordHasher.HashPassword(usuario, dto.NovaSenha.Trim());
        usuario.DeveTrocarSenha = false;
        await _db.SaveChangesAsync();

        return Ok(new { mensagem = "Senha atualizada com sucesso." });
    }
}