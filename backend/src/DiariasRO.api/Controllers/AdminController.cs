using DiariasRO.api.Data;
using DiariasRO.api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiariasRO.api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/v1/admin")]
public class AdminController : ControllerBase
{
    private readonly DiariasDbContext _db;

    public AdminController(DiariasDbContext db)
    {
        _db = db;
    }

    public record AlterarNivelAcessoDto(string NivelAcesso);

    [HttpGet("usuarios")]
    public async Task<IActionResult> ListarUsuarios()
    {
        var usuarios = await _db.Usuarios
            .OrderBy(u => u.NomeCompleto == "" ? u.Matricula : u.NomeCompleto)
            .Select(u => new
            {
                u.Id,
                u.Matricula,
                u.NomeCompleto,
                u.Orgao,
                u.Funcao,
                u.Email,
                u.Celular,
                NivelAcesso = u.NivelAcesso.ToString()
            })
            .ToListAsync();

        return Ok(usuarios);
    }

    [HttpPut("usuarios/{id:guid}/nivel-acesso")]
    public async Task<IActionResult> AlterarNivelAcesso(Guid id, [FromBody] AlterarNivelAcessoDto dto)
    {
        var usuario = await _db.Usuarios.FindAsync(id);
        if (usuario is null)
            return NotFound(new { erro = "Usuário não encontrado." });

        if (!Enum.TryParse<NivelAcesso>(dto.NivelAcesso, ignoreCase: true, out var novoNivel))
            return BadRequest(new { erro = "Nível de acesso inválido. Use: Operador, Gestor ou Admin." });

        // Proteção para impedir que o sistema fique sem nenhum Administrador
        if (usuario.NivelAcesso == NivelAcesso.Admin && novoNivel != NivelAcesso.Admin)
        {
            var totalAdmins = await _db.Usuarios.CountAsync(u => u.NivelAcesso == NivelAcesso.Admin);
            if (totalAdmins <= 1)
                return BadRequest(new { erro = "Não é possível remover a permissão do único Administrador do sistema." });
        }

        usuario.NivelAcesso = novoNivel;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            mensagem = "Permissão atualizada com sucesso.",
            usuario.Id,
            usuario.Matricula,
            NivelAcesso = usuario.NivelAcesso.ToString()
        });
    }
}