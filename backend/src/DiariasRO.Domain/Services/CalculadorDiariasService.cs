using DiariasRO.Domain.Enums;
using DiariasRO.Domain.ValueObjects;
using DiariasRO.Domain.Strategies;

namespace DiariasRO.Domain.Services;

public record SolicitacaoCalculoCommand(
    CategoriaCargo Categoria,
    PeriodoViagem Periodo,
    TipoViagem Tipo,
    decimal? CotacaoDolar,
    bool HospedagemInclusa,
    bool CustosTotaisTerceiros,
    IRegraDiariaStrategy RegraEspecial,
    CategoriaCargo? CategoriaAutoridadeAcompanhada = null
);

public record ResultadoCalculo(
    bool Elegivel,
    string MotivoIneligibilidade,
    int TotalDias,
    decimal ValorUnitarioBaseBrl,
    decimal ValorTotalBrl
);

public class CalculadorDiariasService
{
    public ResultadoCalculo Calcular(SolicitacaoCalculoCommand request)
    {
        if (request.Periodo.TotalHoras < 5)
        {
            return new ResultadoCalculo(false, "Afastamento inferior a 5 horas contínuas.", 0, 0, 0);
        }

        if (request.CustosTotaisTerceiros || request.HospedagemInclusa)
        {
            return new ResultadoCalculo(false, "Hospedagem ou despesas integrais pagas por outra fonte.", 0, 0, 0);
        }

        var categoriaEfetiva = request.CategoriaAutoridadeAcompanhada ?? request.Categoria;
        var valorBase = TabelaValoresRO.ObterValorBase(categoriaEfetiva, request.Tipo);

        if (request.Tipo == TipoViagem.Internacional)
        {
            if (!request.CotacaoDolar.HasValue || request.CotacaoDolar <= 0)
                throw new InvalidOperationException("Cotação do Dólar válida é obrigatória para viagens internacionais.");

            valorBase *= request.CotacaoDolar.Value;
        }

        var totalDias = request.Periodo.TotalDiasCalculados;
        decimal valorTotalAcumulado = 0m;

        for (int dia = 1; dia <= totalDias; dia++)
        {
            valorTotalAcumulado += request.RegraEspecial.AplicarFator(dia, valorBase);
        }

        return new ResultadoCalculo(
            Elegivel: true,
            MotivoIneligibilidade: string.Empty,
            TotalDias: totalDias,
            ValorUnitarioBaseBrl: Math.Round(valorBase, 2),
            ValorTotalBrl: Math.Round(valorTotalAcumulado, 2)
        );
    }
}