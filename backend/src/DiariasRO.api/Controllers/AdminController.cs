using DiariasRO.api.Data;
using DiariasRO.api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiariasRO.api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/v1/admin")]
public class AdminController : ControllerBase
{
    private readonly DiariasDbContext _db;
    private readonly PasswordHasher<Usuario> _passwordHasher = new();

    public AdminController(DiariasDbContext db)
    {
        _db = db;
    }

    public record AlterarNivelAcessoDto(string NivelAcesso);

    public record CriarUsuarioAdminDto(
        string Matricula,
        string NomeCompleto,
        string Orgao,
        string? Funcao,
        string? Email,
        string? Celular,
        string NivelAcesso
    );

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
                u.DeveTrocarSenha,
                NivelAcesso = u.NivelAcesso.ToString()
            })
            .ToListAsync();

        return Ok(usuarios);
    }

    [HttpPost("usuarios")]
    public async Task<IActionResult> CriarUsuario([FromBody] CriarUsuarioAdminDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Matricula) ||
            string.IsNullOrWhiteSpace(dto.NomeCompleto) ||
            string.IsNullOrWhiteSpace(dto.Orgao))
        {
            return BadRequest(new { erro = "Matrícula, Nome Completo e Órgão são obrigatórios." });
        }

        var matricula = dto.Matricula.Trim();
        var jaExiste = await _db.Usuarios.AnyAsync(u => u.Matricula == matricula);
        if (jaExiste)
            return Conflict(new { erro = $"Já existe um servidor cadastrado com a matrícula {matricula}." });

        if (!Enum.TryParse<NivelAcesso>(dto.NivelAcesso, ignoreCase: true, out var nivel))
            nivel = NivelAcesso.Operador;

        var novoUsuario = new Usuario
        {
            Matricula = matricula,
            NomeCompleto = dto.NomeCompleto.Trim(),
            Orgao = dto.Orgao.Trim(),
            Funcao = dto.Funcao?.Trim() ?? string.Empty,
            Email = dto.Email?.Trim() ?? string.Empty,
            Celular = dto.Celular?.Trim() ?? string.Empty,
            NivelAcesso = nivel,
            DeveTrocarSenha = true // Já nasce exigindo troca no 1º login
        };

        novoUsuario.SenhaHash = _passwordHasher.HashPassword(novoUsuario, "SICADI@2026");

        _db.Usuarios.Add(novoUsuario);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            mensagem = "Usuário criado com senha temporária SICADI@2026.",
            usuario = new
            {
                novoUsuario.Id,
                novoUsuario.Matricula,
                novoUsuario.NomeCompleto,
                novoUsuario.Orgao,
                novoUsuario.Funcao,
                novoUsuario.Email,
                novoUsuario.Celular,
                novoUsuario.DeveTrocarSenha,
                NivelAcesso = novoUsuario.NivelAcesso.ToString()
            }
        });
    }

    [HttpPut("usuarios/{id:guid}/nivel-acesso")]
    public async Task<IActionResult> AlterarNivelAcesso(Guid id, [FromBody] AlterarNivelAcessoDto dto)
    {
        var usuario = await _db.Usuarios.FindAsync(id);
        if (usuario is null)
            return NotFound(new { erro = "Usuário não encontrado." });

        if (!Enum.TryParse<NivelAcesso>(dto.NivelAcesso, ignoreCase: true, out var novoNivel))
            return BadRequest(new { erro = "Nível de acesso inválido. Use: Operador, Gestor ou Admin." });

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

    [HttpPut("usuarios/{id:guid}/resetar-senha")]
    public async Task<IActionResult> ResetarSenha(Guid id)
    {
        var usuario = await _db.Usuarios.FindAsync(id);
        if (usuario is null)
            return NotFound(new { erro = "Usuário não encontrado." });

        usuario.SenhaHash = _passwordHasher.HashPassword(usuario, "SICADI@2026");
        usuario.DeveTrocarSenha = true;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            mensagem = $"Senha de {usuario.Matricula} redefinida para SICADI@2026. O usuário será obrigado a alterá-la no próximo login.",
            usuario.Id,
            usuario.DeveTrocarSenha
        });
    }
}