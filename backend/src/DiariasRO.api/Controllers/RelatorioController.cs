using DiariasRO.api.Data;
using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace DiariasRO.api.Controllers;

[ApiController]
[Route("api/v1/relatorio")]
public class RelatorioController : ControllerBase
{
    private readonly DiariasDbContext _db;

    public RelatorioController(DiariasDbContext db)
    {
        _db = db;
        // O QuestPDF exige a declaração do tipo de licença comercial ou comunitária
        QuestPDF.Settings.License = LicenseType.Community;
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GerarPdf(Guid id)
    {
        var historico = await _db.Historicos.FindAsync(id);
        if (historico is null) return NotFound(new { erro = "Cálculo não encontrado." });

        var documento = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily(Fonts.Lato));

                page.Header().Element(ComposeHeader);
                page.Content().Element(x => ComposeContent(x, historico));
                page.Footer().Element(ComposeFooter);
            });
        });

        var pdfBytes = documento.GeneratePdf();
        return File(pdfBytes, "application/pdf", $"Demonstrativo_{historico.MatriculaBeneficiario}.pdf");
    }

    private void ComposeHeader(IContainer container)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item().Text("SICADI").FontSize(16).SemiBold().FontColor("#0F2C59");
                column.Item().Text("Sistema de Calculadora de Diárias").FontSize(10).FontColor(Colors.Grey.Medium);
                column.Item().PaddingTop(5).LineHorizontal(2).LineColor("#059669");
            });
        });
    }

    private void ComposeContent(IContainer container, Models.HistoricoCalculo historico)
    {
        container.PaddingVertical(1, Unit.Centimetre).Column(column =>
        {
            column.Spacing(10);

            column.Item().Text("DEMONSTRATIVO OFICIAL DE CÁLCULO").FontSize(14).SemiBold().AlignCenter();
            
            column.Item().Background(Colors.Grey.Lighten4).Padding(10).Column(dados =>
            {
                dados.Item().Text($"Servidor Beneficiário: {historico.NomeBeneficiario}").SemiBold();
                dados.Item().Text($"Matrícula: {historico.MatriculaBeneficiario}");
                dados.Item().Text($"Órgão: {historico.OrgaoBeneficiario}");
                dados.Item().Text($"Destino: {historico.Destino}");
                dados.Item().Text($"Período: {historico.DataHoraInicio:dd/MM/yyyy HH:mm} a {historico.DataHoraFim:dd/MM/yyyy HH:mm}");
            });

            column.Item().PaddingTop(10).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(3);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                });

                table.Header(header =>
                {
                    header.Cell().BorderBottom(1).PaddingBottom(5).Text("Descrição").SemiBold();
                    header.Cell().BorderBottom(1).PaddingBottom(5).AlignRight().Text("Qtd. Dias").SemiBold();
                    header.Cell().BorderBottom(1).PaddingBottom(5).AlignRight().Text("Valor Unitário").SemiBold();
                    header.Cell().BorderBottom(1).PaddingBottom(5).AlignRight().Text("Subtotal").SemiBold();
                });

                table.Cell().PaddingTop(5).Text("Diária de Campo / Deslocamento");
                table.Cell().PaddingTop(5).AlignRight().Text($"{historico.TotalDias}");
                table.Cell().PaddingTop(5).AlignRight().Text($"R$ {historico.ValorUnitarioBrl:N2}");
                table.Cell().PaddingTop(5).AlignRight().Text($"R$ {historico.ValorTotalBrl:N2}");
            });

            column.Item().PaddingTop(20).AlignRight().Text($"Valor Total Autorizado: R$ {historico.ValorTotalBrl:N2}").FontSize(14).SemiBold().FontColor("#059669");
            
            column.Item().PaddingTop(40).AlignCenter().Column(assinatura =>
            {
                assinatura.Item().LineHorizontal(1).LineColor(Colors.Black);
                assinatura.Item().AlignCenter().Text("Assinatura do Ordenador de Despesas").FontSize(10);
            });
        });
    }

    private void ComposeFooter(IContainer container)
    {
        container.AlignCenter().Text(x =>
        {
            x.Span("Gerado eletronicamente em: ");
            x.Span($"{DateTime.Now:dd/MM/yyyy HH:mm}").SemiBold();
        });
    }
}