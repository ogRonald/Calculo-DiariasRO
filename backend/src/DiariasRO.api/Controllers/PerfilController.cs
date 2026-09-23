using DiariasRO.api.Data;
using DiariasRO.api.Dtos;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DiariasRO.api.Models;

namespace DiariasRO.api.Controllers;

[ApiController]
[Route("api/v1/perfil")]
public class PerfilController : ControllerBase
{
    private readonly DiariasDbContext _db;

    public PerfilController(DiariasDbContext db)
    {
        _db = db;
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Obter(Guid id)
    {
        var usuario = await _db.Usuarios.FindAsync(id);
        if (usuario is null)
            return NotFound(new { erro = "Usuário não encontrado." });

        return Ok(new PerfilDto(
            usuario.Id,
            usuario.Matricula,
            usuario.Orgao,
            usuario.NomeCompleto,
            usuario.Funcao,
            usuario.Email,
            usuario.Celular
        ));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] AtualizarPerfilDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NomeCompleto))
            return BadRequest(new { erro = "Informe o nome completo." });

        if (string.IsNullOrWhiteSpace(dto.Funcao))
            return BadRequest(new { erro = "Informe a função/cargo." });

        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(new { erro = "Informe o e-mail." });

        if (string.IsNullOrWhiteSpace(dto.Celular))
            return BadRequest(new { erro = "Informe o celular." });

        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (usuario is null)
            return NotFound(new { erro = "Usuário não encontrado." });

        var perfilJaCompleto = !string.IsNullOrWhiteSpace(usuario.NomeCompleto)
            && !string.IsNullOrWhiteSpace(usuario.Funcao)
            && !string.IsNullOrWhiteSpace(usuario.Email)
            && !string.IsNullOrWhiteSpace(usuario.Celular);

        // Alterações em um perfil já completo exigem a senha atual.
        if (perfilJaCompleto)
        {
            if (string.IsNullOrWhiteSpace(dto.Senha))
                return Unauthorized(new { erro = "Informe sua senha atual para alterar os dados do perfil." });

            var passwordHasher = new PasswordHasher<Usuario>();
            var resultado = passwordHasher.VerifyHashedPassword(usuario, usuario.SenhaHash, dto.Senha);
            if (resultado == PasswordVerificationResult.Failed)
                return Unauthorized(new { erro = "Senha atual inválida. Nenhuma alteração foi realizada." });
        }

        usuario.NomeCompleto = dto.NomeCompleto.Trim();
        usuario.Funcao = dto.Funcao.Trim();
        usuario.Email = dto.Email?.Trim() ?? string.Empty;
        usuario.Celular = dto.Celular?.Trim() ?? string.Empty;

        await _db.SaveChangesAsync();

        return Ok(new PerfilDto(
            usuario.Id,
            usuario.Matricula,
            usuario.Orgao,
            usuario.NomeCompleto,
            usuario.Funcao,
            usuario.Email,
            usuario.Celular
        ));
    }
}
