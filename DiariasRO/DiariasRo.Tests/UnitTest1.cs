using Xunit;
using System;
using DiariasRO.Domain.Enums;
using DiariasRO.Domain.Services;
using DiariasRO.Domain.Strategies;
using DiariasRO.Domain.ValueObjects;

namespace DiariasRO.Tests
{
    public class TestesDoCalculoDiarias
    {
        [Fact]
        public void TesteViagemMenorQue5Horas()
        {
            var servico = new CalculadorDiariasService();

            // Viagem de 4 horas (das 08:00 às 12:00 do mesmo dia)
            var dataIda = new DateTime(2026, 1, 1, 8, 0, 0);
            var dataVolta = new DateTime(2026, 1, 1, 12, 0, 0);
            var periodo = new PeriodoViagem(dataIda, dataVolta);

            var pedido = new SolicitacaoCalculoCommand(
                CategoriaCargo.GerenciaIntermediariaEDemais,
                periodo,
                TipoViagem.Nacional,
                null,
                false,
                false,
                new RegraPadraoStrategy()
            );

            var resultado = servico.Calcular(pedido);
            Assert.False(resultado.Elegivel);
        }

        [Fact]
        public void TesteHospedagemPagaPorTerceiros()
        {
            var servico = new CalculadorDiariasService();
            // 1 dia de viagem exato
            var periodo = new PeriodoViagem(new DateTime(2026, 1, 1, 8, 0, 0), new DateTime(2026, 1, 2, 8, 0, 0));

            var pedido = new SolicitacaoCalculoCommand(
                CategoriaCargo.GerenciaIntermediariaEDemais,
                periodo,
                TipoViagem.Nacional,
                null,
                true,
                false,
                new RegraPadraoStrategy()
            );

            var resultado = servico.Calcular(pedido);
            Assert.False(resultado.Elegivel);
        }

        [Fact]
        public void TesteDiariaDoGovernadorNacional()
        {
            var servico = new CalculadorDiariasService();
            var periodo = new PeriodoViagem(new DateTime(2026, 1, 1, 8, 0, 0), new DateTime(2026, 1, 2, 8, 0, 0));

            var pedido = new SolicitacaoCalculoCommand(
                CategoriaCargo.GovernadorVice,
                periodo,
                TipoViagem.Nacional,
                null,
                false,
                false,
                new RegraPadraoStrategy()
            );

            var resultado = servico.Calcular(pedido);
            Assert.Equal(713.00m, resultado.ValorTotalBrl);
        }

        [Fact]
        public void TesteDiariaGerenciaNacional()
        {
            var servico = new CalculadorDiariasService();
            var periodo = new PeriodoViagem(new DateTime(2026, 1, 1, 8, 0, 0), new DateTime(2026, 1, 2, 8, 0, 0));

            var pedido = new SolicitacaoCalculoCommand(
                CategoriaCargo.GerenciaIntermediariaEDemais,
                periodo,
                TipoViagem.Nacional,
                null,
                false,
                false,
                new RegraPadraoStrategy()
            );

            var resultado = servico.Calcular(pedido);
            Assert.Equal(445.00m, resultado.ValorTotalBrl);
        }

        [Fact]
        public void TesteViagemInternacionalComDolar()
        {
            var servico = new CalculadorDiariasService();
            var periodo = new PeriodoViagem(new DateTime(2026, 1, 1, 8, 0, 0), new DateTime(2026, 1, 2, 8, 0, 0));

            var pedido = new SolicitacaoCalculoCommand(
                CategoriaCargo.GovernadorVice,
                periodo,
                TipoViagem.Internacional,
                5.00m,
                false,
                false,
                new RegraPadraoStrategy()
            );

            var resultado = servico.Calcular(pedido);
            Assert.Equal(3705.00m, resultado.ValorTotalBrl);
        }

        [Fact]
        public void TesteAcompanhandoAutoridadeMaior()
        {
            var servico = new CalculadorDiariasService();
            var periodo = new PeriodoViagem(new DateTime(2026, 1, 1, 8, 0, 0), new DateTime(2026, 1, 2, 8, 0, 0));

            var pedido = new SolicitacaoCalculoCommand(
                CategoriaCargo.GerenciaIntermediariaEDemais,
                periodo,
                TipoViagem.Nacional,
                null,
                false,
                false,
                new RegraPadraoStrategy(),
                CategoriaCargo.GovernadorVice
            );

            var resultado = servico.Calcular(pedido);
            Assert.Equal(713.00m, resultado.ValorTotalBrl);
        }

        [Fact]
        public void TesteCursoLongoAteQuinzeDias()
        {
            var servico = new CalculadorDiariasService();
            // 15 dias de viagem
            var periodo = new PeriodoViagem(new DateTime(2026, 1, 1, 8, 0, 0), new DateTime(2026, 1, 16, 8, 0, 0));

            var pedido = new SolicitacaoCalculoCommand(
                CategoriaCargo.GerenciaIntermediariaEDemais,
                periodo,
                TipoViagem.Nacional,
                null,
                false,
                false,
                new RegraCursoLongoStrategy()
            );

            var resultado = servico.Calcular(pedido);
            Assert.Equal(6675.00m, resultado.ValorTotalBrl);
        }
    }
}