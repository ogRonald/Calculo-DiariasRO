using Microsoft.AspNetCore.Mvc;
using DiariasRO.Domain.Services;
using DiariasRO.Domain.ValueObjects;
using DiariasRO.Domain.Strategies;
using DiariasRO.api.Dtos;

namespace DiariasRO.api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class DiariasController : ControllerBase
{
    private readonly CalculadorDiariasService _calculador;

    public DiariasController(CalculadorDiariasService calculador)
    {
        _calculador = calculador;
    }

    [HttpPost("calcular-previa")]
    public IActionResult CalcularPrevia([FromBody] RequisicaoCalculoDto dto)
    {
        try
        {
            var periodo = new PeriodoViagem(dto.DataHoraInicio, dto.DataHoraFim);
            
            IRegraDiariaStrategy strategy = dto.TipoRegra switch
            {
                "CursoLongo" => new RegraCursoLongoStrategy(),
                "AgenteMultiplicador" or "JOER" => new RegraReducaoCinquentaPercentualStrategy(),
                _ => new RegraPadraoStrategy()
            };

            var command = new SolicitacaoCalculoCommand(
                dto.Categoria, 
                periodo, 
                dto.Tipo, 
                dto.CotacaoDolar,
                dto.HospedagemInclusa, 
                dto.CustosTotaisTerceiros, 
                strategy,
                dto.CategoriaAutoridadeAcompanhada
            );

            var resultado = _calculador.Calcular(command);
            return Ok(resultado);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { erro = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { erro = ex.Message });
        }
    }
}