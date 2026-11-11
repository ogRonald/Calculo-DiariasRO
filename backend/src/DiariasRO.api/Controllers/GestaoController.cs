using DiariasRO.api.Data;
using DiariasRO.api.Dtos;
using DiariasRO.api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DiariasRO.api.Controllers;

// A MÁGICA DA FASE 2: Apenas utilizadores com a Role "Gestor" podem aceder a este controlador!
[Authorize(Roles = "Gestor")] 
[ApiController]
[Route("api/v1/[controller]")]
public class GestaoController : ControllerBase
{
    private readonly DiariasDbContext _db;

    public GestaoController(DiariasDbContext db)
    {
        _db = db;
    }

    // 1. LISTAR PENDENTES
    [HttpGet("pendentes")]
    public async Task<IActionResult> ObterPendentes()
    {
        // Busca todos os cálculos que estão com status Pendente.
        // O .Include(h => h.Usuario) serve para o Gestor ver o nome de quem pediu.
        var pendentes = await _db.Historicos // Substitua por _db.Diarias se for esse o nome da sua tabela
            .Include(h => h.Usuario)
            .Where(h => h.Status == StatusDiaria.Pendente)
            .OrderBy(h => h.CriadoEm)
            .Select(h => new 
            {
                h.Id,
                h.CriadoEm,
                h.ValorTotalBrl,
                h.Destino,
                UsuarioNome = h.Usuario!.NomeCompleto,
                UsuarioOrgao = h.Usuario.Orgao,
                h.Status
            })
            .ToListAsync();

        return Ok(pendentes);
    }

    // 2. APROVAR DIÁRIA
    [HttpPut("{id:guid}/aprovar")]
    public async Task<IActionResult> Aprovar(Guid id)
    {
        var historico = await _db.Historicos.FindAsync(id);

        if (historico == null)
            return NotFound(new { erro = "Cálculo não encontrado." });

        if (historico.Status != StatusDiaria.Pendente)
            return BadRequest(new { erro = "Apenas cálculos pendentes podem ser aprovados." });

        // Identifica o Gestor que está a fazer a ação (extraído do Token JWT)
        var gestorId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        historico.Status = StatusDiaria.Aprovado;
        historico.GestorAprovadorId = Guid.Parse(gestorId!); // Salva quem aprovou
        historico.DataAprovacao = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new { mensagem = "Cálculo aprovado com sucesso!" });
    }

    // 3. DEVOLVER DIÁRIA (Rejeitar com correção)
    [HttpPut("{id:guid}/devolver")]
    public async Task<IActionResult> Devolver(Guid id, [FromBody] DevolverDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.MotivoDevolucao))
            return BadRequest(new { erro = "É obrigatório informar o motivo da devolução." });

        var historico = await _db.Historicos.FindAsync(id);

        if (historico == null)
            return NotFound(new { erro = "Cálculo não encontrado." });

        if (historico.Status != StatusDiaria.Pendente)
            return BadRequest(new { erro = "Apenas cálculos pendentes podem ser devolvidos." });

        var gestorId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        historico.Status = StatusDiaria.Devolvido;
        historico.GestorAprovadorId = Guid.Parse(gestorId!);
        historico.MotivoDevolucao = dto.MotivoDevolucao;
        historico.DataAprovacao = DateTime.UtcNow; // Usamos o mesmo campo de data para registar quando foi avaliado

        await _db.SaveChangesAsync();

        return Ok(new { mensagem = "Cálculo devolvido para correção." });
    }
}