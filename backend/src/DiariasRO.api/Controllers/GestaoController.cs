using DiariasRO.api.Data;
using DiariasRO.api.Dtos;
using DiariasRO.api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DiariasRO.api.Controllers;

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

    // 1. LISTAR TODAS AS DIÁRIAS (Dashboard Completo: Pendentes, Aprovadas, Devolvidas e Recusadas)
    [HttpGet("todas")]
    public async Task<IActionResult> ObterTodas()
    {
        var lista = await _db.Historicos
            .Include(h => h.Usuario)
            .OrderByDescending(h => h.CriadoEm)
            .Select(h => new 
            {
                h.Id,
                h.CriadoEm,
                h.DataHoraInicio,
                h.DataHoraFim,
                h.TotalDias,
                h.ValorUnitarioBrl,
                h.ValorTotalBrl,
                h.Destino,
                h.NomeBeneficiario,
                h.MatriculaBeneficiario,
                h.OrgaoBeneficiario,
                UsuarioNome = h.Usuario != null ? h.Usuario.NomeCompleto : "Sistema",
                UsuarioOrgao = h.Usuario != null ? h.Usuario.Orgao : "",
                h.Status,
                h.MotivoDevolucao,
                h.DataAprovacao
            })
            .ToListAsync();

        return Ok(lista);
    }

    // 2. LISTAR APENAS PENDENTES
    [HttpGet("pendentes")]
    public async Task<IActionResult> ObterPendentes()
    {
        var pendentes = await _db.Historicos
            .Include(h => h.Usuario)
            .Where(h => h.Status == StatusDiaria.Pendente)
            .OrderBy(h => h.CriadoEm)
            .Select(h => new 
            {
                h.Id,
                h.CriadoEm,
                h.DataHoraInicio,
                h.DataHoraFim,
                h.TotalDias,
                h.ValorUnitarioBrl,
                h.ValorTotalBrl,
                h.Destino,
                h.NomeBeneficiario,
                h.MatriculaBeneficiario,
                h.OrgaoBeneficiario,
                UsuarioNome = h.Usuario != null ? h.Usuario.NomeCompleto : "Sistema",
                UsuarioOrgao = h.Usuario != null ? h.Usuario.Orgao : "",
                h.Status,
                h.MotivoDevolucao
            })
            .ToListAsync();

        return Ok(pendentes);
    }

    // 3. CONSULTAR SOLICITAÇÃO INDIVIDUAL POR ID
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var diaria = await _db.Historicos
            .Include(h => h.Usuario)
            .Where(h => h.Id == id)
            .Select(h => new 
            {
                h.Id,
                h.CriadoEm,
                h.DataHoraInicio,
                h.DataHoraFim,
                h.TotalDias,
                h.ValorUnitarioBrl,
                h.ValorTotalBrl,
                h.Destino,
                h.NomeBeneficiario,
                h.MatriculaBeneficiario,
                h.OrgaoBeneficiario,
                UsuarioNome = h.Usuario != null ? h.Usuario.NomeCompleto : "Sistema",
                UsuarioOrgao = h.Usuario != null ? h.Usuario.Orgao : "",
                h.Status,
                h.MotivoDevolucao,
                h.DataAprovacao
            })
            .FirstOrDefaultAsync();

        if (diaria == null)
            return NotFound(new { erro = "Solicitação não encontrada." });

        return Ok(diaria);
    }

    // 4. APROVAR DIÁRIA
    [HttpPut("{id:guid}/aprovar")]
    public async Task<IActionResult> Aprovar(Guid id)
    {
        var historico = await _db.Historicos.FindAsync(id);

        if (historico == null)
            return NotFound(new { erro = "Cálculo não encontrado." });

        if (historico.Status != StatusDiaria.Pendente)
            return BadRequest(new { erro = "Apenas cálculos pendentes podem ser aprovados." });

        var gestorId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        historico.Status = StatusDiaria.Aprovado;
        if (Guid.TryParse(gestorId, out var gestorGuid))
        {
            historico.GestorAprovadorId = gestorGuid;
        }
        historico.DataAprovacao = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new { mensagem = "Cálculo aprovado com sucesso!" });
    }

    // 5. DEVOLVER DIÁRIA (Para correção)
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
        if (Guid.TryParse(gestorId, out var gestorGuid))
        {
            historico.GestorAprovadorId = gestorGuid;
        }
        historico.MotivoDevolucao = dto.MotivoDevolucao;
        historico.DataAprovacao = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new { mensagem = "Cálculo devolvido para correção." });
    }

    // 6. RECUSAR / NEGAR DIÁRIA
    [HttpPut("{id:guid}/rejeitar")]
    public async Task<IActionResult> Rejeitar(Guid id, [FromBody] DevolverDto? dto)
    {
        var historico = await _db.Historicos.FindAsync(id);

        if (historico == null)
            return NotFound(new { erro = "Cálculo não encontrado." });

        if (historico.Status != StatusDiaria.Pendente)
            return BadRequest(new { erro = "Apenas cálculos pendentes podem ser rejeitados." });

        var gestorId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        historico.Status = (StatusDiaria)3;
        if (Guid.TryParse(gestorId, out var gestorGuid))
        {
            historico.GestorAprovadorId = gestorGuid;
        }
        if (!string.IsNullOrWhiteSpace(dto?.MotivoDevolucao))
        {
            historico.MotivoDevolucao = dto.MotivoDevolucao;
        }
        historico.DataAprovacao = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new { mensagem = "Cálculo rejeitado." });
    }
}