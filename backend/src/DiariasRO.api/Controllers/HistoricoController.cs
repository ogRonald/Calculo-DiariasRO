using DiariasRO.api.Data;
using DiariasRO.api.Dtos;
using DiariasRO.api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiariasRO.api.Controllers;

[ApiController]
[Route("api/v1/historico")]
public class HistoricoController : ControllerBase
{
    private readonly DiariasDbContext _db;
    public HistoricoController(DiariasDbContext db) => _db = db;

    [HttpGet("{usuarioId:guid}")]
    public async Task<IActionResult> Listar(Guid usuarioId)
    {
        var itens = await _db.Historicos
            .Where(h => h.UsuarioId == usuarioId)
            .OrderByDescending(h => h.CriadoEm)
            // Atualizado para retornar o NomeBeneficiario
            .Select(h => new { h.Id, h.NomeBeneficiario, h.Destino, h.TotalDias, h.ValorUnitarioBrl, h.ValorTotalBrl, h.CriadoEm })
            .ToListAsync();
        return Ok(itens);
    }

    [HttpPost]
    public async Task<IActionResult> Salvar([FromBody] SalvarHistoricoDto dto)
    {
        var usuarioExiste = await _db.Usuarios.AnyAsync(u => u.Id == dto.UsuarioId);
        if (!usuarioExiste) return NotFound(new { erro = "Usuário operador não encontrado." });

        var item = new HistoricoCalculo
        {
            UsuarioId = dto.UsuarioId,
            NomeBeneficiario = dto.NomeBeneficiario,           // Mapeado
            MatriculaBeneficiario = dto.MatriculaBeneficiario, // Mapeado
            OrgaoBeneficiario = dto.OrgaoBeneficiario,         // Mapeado
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
}