using System.Security.Claims;
using DiariasRO.api.Data;
using DiariasRO.api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace DiariasRO.api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/perfil")]
public class PerfilController : ControllerBase
{
    private readonly DiariasDbContext _db;
    private readonly PasswordHasher<Usuario> _passwordHasher = new();

    public PerfilController(DiariasDbContext db)
    {
        _db = db;
    }

    public record AtualizarPerfilDto(
        string NomeCompleto,
        string? Orgao,
        string Funcao,
        string Email,
        string Celular,
        string Senha,
        string? NovaSenha
    );

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObterPerfil(Guid id)
    {
        var usuario = await _db.Usuarios.FindAsync(id);
        if (usuario is null)
            return NotFound(new { erro = "Usuário não encontrado." });

        return Ok(new
        {
            usuario.Id,
            usuario.Matricula,
            usuario.NomeCompleto,
            usuario.Orgao,
            usuario.Funcao,
            usuario.Email,
            usuario.Celular,
            NivelAcesso = usuario.NivelAcesso.ToString()
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> AtualizarPerfil(Guid id, [FromBody] AtualizarPerfilDto dto)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(userIdClaim, out var tokenUserId) && tokenUserId != id)
            return Forbid();

        var usuario = await _db.Usuarios.FindAsync(id);
        if (usuario is null)
            return NotFound(new { erro = "Usuário não encontrado." });

        if (string.IsNullOrWhiteSpace(dto.Senha))
            return BadRequest(new { erro = "Informe a sua senha atual para confirmar as alterações." });

        // Valida a senha atual antes de alterar dados ou redefinir senha
        var verificacao = _passwordHasher.VerifyHashedPassword(usuario, usuario.SenhaHash, dto.Senha);
        if (verificacao == PasswordVerificationResult.Failed)
            return Unauthorized(new { erro = "Senha atual incorreta." });

        // Se o usuário preencheu uma nova senha, valida e atualiza o hash
        if (!string.IsNullOrWhiteSpace(dto.NovaSenha))
        {
            var novaSenhaLimpa = dto.NovaSenha.Trim();
            if (novaSenhaLimpa.Length < 6)
                return BadRequest(new { erro = "A nova senha deve ter no mínimo 6 caracteres." });

            if (novaSenhaLimpa == "SICADI@2026")
                return BadRequest(new { erro = "A nova senha não pode ser igual à senha temporária padrão." });

            usuario.SenhaHash = _passwordHasher.HashPassword(usuario, novaSenhaLimpa);
            usuario.DeveTrocarSenha = false;
        }

        usuario.NomeCompleto = dto.NomeCompleto.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Orgao))
            usuario.Orgao = dto.Orgao.Trim();
        usuario.Funcao = dto.Funcao.Trim();
        usuario.Email = dto.Email.Trim();
        usuario.Celular = dto.Celular.Trim();

        await _db.SaveChangesAsync();

        return Ok(new
        {
            mensagem = !string.IsNullOrWhiteSpace(dto.NovaSenha)
                ? "Dados cadastrais e senha atualizados com sucesso!"
                : "Dados cadastrais atualizados com sucesso!",
            usuario = new
            {
                usuario.Id,
                usuario.Matricula,
                usuario.NomeCompleto,
                usuario.Orgao,
                usuario.Funcao,
                usuario.Email,
                usuario.Celular,
                NivelAcesso = usuario.NivelAcesso.ToString()
            }
        });
    }
}