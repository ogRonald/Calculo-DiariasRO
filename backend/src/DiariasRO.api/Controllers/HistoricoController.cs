using DiariasRO.api.Data;
using DiariasRO.api.Dtos;
using DiariasRO.api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiariasRO.api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/historico")]
public class HistoricoController : ControllerBase
{
    private readonly DiariasDbContext _db;
    public HistoricoController(DiariasDbContext db) => _db = db;

    public record CorrigirHistoricoDto(
        string NomeBeneficiario,
        string MatriculaBeneficiario,
        string OrgaoBeneficiario,
        string Destino,
        DateTime DataHoraInicio,
        DateTime DataHoraFim,
        int TotalDias,
        decimal ValorUnitarioBrl,
        decimal ValorTotalBrl
    );

    [HttpGet("{usuarioId:guid}")]
    public async Task<IActionResult> Listar(Guid usuarioId)
    {
        var itens = await _db.Historicos
            .Where(h => h.UsuarioId == usuarioId)
            .OrderByDescending(h => h.CriadoEm)
            .Select(h => new
            {
                h.Id,
                h.NomeBeneficiario,
                h.MatriculaBeneficiario,
                h.OrgaoBeneficiario,
                h.Destino,
                h.DataHoraInicio,
                h.DataHoraFim,
                h.TotalDias,
                h.ValorUnitarioBrl,
                h.ValorTotalBrl,
                h.CriadoEm,
                h.Status,
                h.MotivoDevolucao,
                h.DataAprovacao
            })
            .ToListAsync();

        return Ok(itens);
    }

    [HttpGet("item/{id:guid}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var item = await _db.Historicos
            .Where(h => h.Id == id)
            .Select(h => new
            {
                h.Id,
                h.UsuarioId,
                h.NomeBeneficiario,
                h.MatriculaBeneficiario,
                h.OrgaoBeneficiario,
                h.Destino,
                h.DataHoraInicio,
                h.DataHoraFim,
                h.TotalDias,
                h.ValorUnitarioBrl,
                h.ValorTotalBrl,
                h.CriadoEm,
                h.Status,
                h.MotivoDevolucao
            })
            .FirstOrDefaultAsync();

        if (item is null)
            return NotFound(new { erro = "Solicitação não encontrada." });

        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Salvar([FromBody] SalvarHistoricoDto dto)
    {
        var usuarioExiste = await _db.Usuarios.AnyAsync(u => u.Id == dto.UsuarioId);
        if (!usuarioExiste) return NotFound(new { erro = "Usuário operador não encontrado." });

        var item = new HistoricoCalculo
        {
            UsuarioId = dto.UsuarioId,
            NomeBeneficiario = dto.NomeBeneficiario,
            MatriculaBeneficiario = dto.MatriculaBeneficiario,
            OrgaoBeneficiario = dto.OrgaoBeneficiario,
            Destino = dto.Destino,
            DataHoraInicio = dto.DataHoraInicio,
            DataHoraFim = dto.DataHoraFim,
            TotalDias = dto.TotalDias,
            ValorUnitarioBrl = dto.ValorUnitarioBrl,
            ValorTotalBrl = dto.ValorTotalBrl
        };

        _db.Historicos.Add(item);
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPut("{id:guid}/corrigir")]
    public async Task<IActionResult> Corrigir(Guid id, [FromBody] CorrigirHistoricoDto dto)
    {
        var item = await _db.Historicos.FindAsync(id);
        if (item is null)
            return NotFound(new { erro = "Solicitação não encontrada." });

        if (item.Status != StatusDiaria.Devolvido)
            return BadRequest(new { erro = "Apenas solicitações com status 'Devolvido' podem ser corrigidas e reenviadas." });

        item.NomeBeneficiario = dto.NomeBeneficiario.Trim();
        item.MatriculaBeneficiario = dto.MatriculaBeneficiario.Trim();
        item.OrgaoBeneficiario = dto.OrgaoBeneficiario.Trim();
        item.Destino = dto.Destino.Trim();
        item.DataHoraInicio = dto.DataHoraInicio;
        item.DataHoraFim = dto.DataHoraFim;
        item.TotalDias = dto.TotalDias;
        item.ValorUnitarioBrl = dto.ValorUnitarioBrl;
        item.ValorTotalBrl = dto.ValorTotalBrl;

        // Retorna o processo para a fila de análise do gestor
        item.Status = StatusDiaria.Pendente;
        item.MotivoDevolucao = null;
        item.GestorAprovadorId = null;
        item.DataAprovacao = null;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            mensagem = "Solicitação corrigida e reenviada para aprovação com sucesso.",
            item.Id,
            item.Status
        });
    }
}