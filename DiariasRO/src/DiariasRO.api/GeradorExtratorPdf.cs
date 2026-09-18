using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using DiariasRO.Domain.Services;

namespace DiariasRO.Api
{
    public class GeradorExtratorPdf
    {
        public byte[] GerarRelatorio(ResultadoCalculo resultado, string nomeServidor)
        {
            // Configuração obrigatória da biblioteca para uso de estudantes/gratuito
            QuestPDF.Settings.License = LicenseType.Community;

            var documento = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(12));

                    // Cabeçalho do PDF
                    page.Header().Text("Extrato Detalhado de Diárias - UniSAPIENS")
                        .SemiBold().FontSize(20).FontColor(Colors.Blue.Darken2);

                    // Conteúdo (As linhas do extrato)
                    page.Content().PaddingVertical(1, Unit.Centimetre).Column(coluna =>
                    {
                        coluna.Item().Text($"Nome do Servidor: {nomeServidor}");
                        coluna.Item().Text($"Status da Solicitação: {(resultado.Elegivel ? "Aprovada" : "Negada")}");

                        // Se a viagem foi barrada, mostra o motivo em vermelho
                        if (!resultado.Elegivel)
                        {
                            coluna.Item().Text($"Motivo: {resultado.MotivoIneligibilidade}").FontColor(Colors.Red.Medium);
                        }
                        // Se foi aprovada, mostra os valores da diária
                        else
                        {
                            coluna.Item().Text($"Total de Dias: {resultado.TotalDias}");
                            coluna.Item().Text($"Valor Base Diário: R$ {resultado.ValorUnitarioBaseBrl}");
                            coluna.Item().Text($"Valor Total a Receber: R$ {resultado.ValorTotalBrl}").SemiBold();
                        }

                        coluna.Item().PaddingTop(20).Text("Relatório gerado automaticamente pelo sistema de cálculo.");
                    });

                    // Rodapé com número da página
                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("Página ");
                        x.CurrentPageNumber();
                        x.Span(" de ");
                        x.TotalPages();
                    });
                });
            });

            // Retorna o arquivo pronto para ser baixado
            return documento.GeneratePdf();
        }
    }
}