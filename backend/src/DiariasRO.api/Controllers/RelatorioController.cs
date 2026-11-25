using System.Globalization;
using DiariasRO.api.Data;
using DiariasRO.api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        QuestPDF.Settings.License = LicenseType.Community;
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GerarPdf(Guid id)
    {
        var historico = await _db.Historicos
            .Include(h => h.Usuario)
            .FirstOrDefaultAsync(h => h.Id == id);

        if (historico is null)
            return NotFound(new { erro = "Cálculo não encontrado." });

        string? nomeGestor = null;
        if (historico.GestorAprovadorId.HasValue)
        {
            nomeGestor = await _db.Usuarios
                .Where(u => u.Id == historico.GestorAprovadorId.Value)
                .Select(u => u.NomeCompleto)
                .FirstOrDefaultAsync();
        }

        var documento = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10.5f).FontFamily("Lato").FontColor("#1E293B"));

                page.Header().Element(c => ComposeHeader(c, historico));
                page.Content().Element(c => ComposeContent(c, historico, nomeGestor));
                page.Footer().Element(ComposeFooter);
            });
        });

        var pdfBytes = documento.GeneratePdf();
        var matriculaArquivo = string.IsNullOrWhiteSpace(historico.MatriculaBeneficiario)
            ? historico.Id.ToString()[..8]
            : historico.MatriculaBeneficiario;

        return File(pdfBytes, "application/pdf", $"Demonstrativo_{matriculaArquivo}.pdf");
    }

    private void ComposeHeader(IContainer container, HistoricoCalculo historico)
    {
        var (statusTexto, statusCor, statusBg) = ObterEstiloStatus(historico.Status);

        container.Column(column =>
        {
            column.Item().Row(row =>
            {
                row.RelativeItem().Column(col =>
                {
                    col.Item().Text("SICADI").FontSize(18).Bold().FontColor("#0F2C59");
                    col.Item().Text("Sistema de Cálculo de Diárias • Estado de Rondônia").FontSize(9.5f).FontColor(Colors.Grey.Darken1);
                });

                row.ConstantItem(155).AlignRight().AlignMiddle()
                    .Background(statusBg)
                    .Border(1).BorderColor(statusCor)
                    .PaddingVertical(5).PaddingHorizontal(8)
                    .AlignCenter()
                    .Text(statusTexto)
                    .FontSize(9).Bold().FontColor(statusCor);
            });

            column.Item().PaddingTop(8).LineHorizontal(2).LineColor("#059669");
        });
    }

    private void ComposeContent(IContainer container, HistoricoCalculo historico, string? nomeGestor)
    {
        var culturaBr = new CultureInfo("pt-BR");
        var valorUnitarioFormatado = historico.ValorUnitarioBrl.ToString("C", culturaBr);
        var valorTotalFormatado = historico.ValorTotalBrl.ToString("C", culturaBr);
        var dataRegistroFormatada = historico.CriadoEm.ToString("dd/MM/yyyy HH:mm");
        var dataDespachoFormatada = historico.DataAprovacao.HasValue
            ? historico.DataAprovacao.Value.ToString("dd/MM/yyyy HH:mm")
            : string.Empty;

        var nomeSolicitante = historico.Usuario?.NomeCompleto ?? "Solicitante do Sistema";
        var matriculaSolicitante = historico.Usuario?.Matricula;
        var textoSolicitante = string.IsNullOrWhiteSpace(matriculaSolicitante)
            ? nomeSolicitante
            : $"{nomeSolicitante} (Mat: {matriculaSolicitante})";

        container.PaddingVertical(0.8f, Unit.Centimetre).Column(column =>
        {
            column.Spacing(12);

            column.Item().Column(titulo =>
            {
                titulo.Item().Text("DEMONSTRATIVO OFICIAL DE CÁLCULO DE DIÁRIAS").FontSize(13).Bold().FontColor("#0F2C59").AlignCenter();
                titulo.Item().Text($"Protocolo: {historico.Id}").FontSize(8.5f).FontColor(Colors.Grey.Medium).AlignCenter();
            });

            // Bloco 1: Beneficiário (Viajante) e Dados do Deslocamento
            column.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten4).Padding(12).Column(dados =>
            {
                dados.Spacing(4);
                dados.Item().Text("1. IDENTIFICAÇÃO DO BENEFICIÁRIO (VIAJANTE) E DESLOCAMENTO").FontSize(9).Bold().FontColor("#0F2C59");
                dados.Item().PaddingBottom(4).LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten2);

                dados.Item().Text(t =>
                {
                    t.Span("Servidor Beneficiário: ").SemiBold();
                    t.Span(string.IsNullOrWhiteSpace(historico.NomeBeneficiario) ? "Não informado" : historico.NomeBeneficiario);
                });

                dados.Item().Row(r =>
                {
                    r.RelativeItem().Text(t =>
                    {
                        t.Span("Matrícula: ").SemiBold();
                        t.Span(string.IsNullOrWhiteSpace(historico.MatriculaBeneficiario) ? "—" : historico.MatriculaBeneficiario);
                    });
                    r.RelativeItem().Text(t =>
                    {
                        t.Span("Órgão / Lotação: ").SemiBold();
                        t.Span(string.IsNullOrWhiteSpace(historico.OrgaoBeneficiario) ? "—" : historico.OrgaoBeneficiario);
                    });
                });

                dados.Item().Text(t =>
                {
                    t.Span("Destino: ").SemiBold();
                    t.Span(historico.Destino);
                });

                dados.Item().Text(t =>
                {
                    t.Span("Período do Afastamento: ").SemiBold();
                    t.Span($"{historico.DataHoraInicio:dd/MM/yyyy HH:mm} até {historico.DataHoraFim:dd/MM/yyyy HH:mm}");
                });
            });

            // Bloco 2: Rastreabilidade da Solicitação
            column.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(rast =>
            {
                rast.Spacing(3);
                rast.Item().Text("2. ORIGEM DA SOLICITAÇÃO").FontSize(9).Bold().FontColor("#0F2C59");
                rast.Item().Text(t =>
                {
                    t.Span("Registrado por (Solicitante): ").SemiBold();
                    t.Span(textoSolicitante);
                });
                rast.Item().Text(t =>
                {
                    t.Span("Data do Registro: ").SemiBold();
                    t.Span(dataRegistroFormatada);
                });
            });

            // Bloco 3: Memória de Cálculo Financeiro
            column.Item().PaddingTop(4).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(3);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1.2f);
                    columns.RelativeColumn(1.2f);
                });

                table.Header(header =>
                {
                    header.Cell().Background("#0F2C59").Padding(6).Text("Descrição").FontSize(9.5f).SemiBold().FontColor(Colors.White);
                    header.Cell().Background("#0F2C59").Padding(6).AlignRight().Text("Qtd. Dias").FontSize(9.5f).SemiBold().FontColor(Colors.White);
                    header.Cell().Background("#0F2C59").Padding(6).AlignRight().Text("Valor Unitário").FontSize(9.5f).SemiBold().FontColor(Colors.White);
                    header.Cell().Background("#0F2C59").Padding(6).AlignRight().Text("Subtotal").FontSize(9.5f).SemiBold().FontColor(Colors.White);
                });

                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Text("Diária de Campo / Deslocamento");
                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).AlignRight().Text($"{historico.TotalDias}");
                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).AlignRight().Text(valorUnitarioFormatado);
                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).AlignRight().Text(valorTotalFormatado);
            });

            column.Item().AlignRight().Background("#ECFDF5").Border(1).BorderColor("#A7F3D0").PaddingVertical(8).PaddingHorizontal(14)
                .Text($"Valor Total Calculado: {valorTotalFormatado}")
                .FontSize(13).Bold().FontColor("#059669");

            // Bloco 4: Parecer da Gestão (exibido quando avaliado ou quando há justificativa)
            var statusNum = (int)historico.Status;
            if (statusNum != 0 || !string.IsNullOrWhiteSpace(historico.MotivoDevolucao))
            {
                var (statusTexto, statusCor, statusBg) = ObterEstiloStatus(historico.Status);

                column.Item().Border(1).BorderColor(statusCor).Background(statusBg).Padding(10).Column(parecer =>
                {
                    parecer.Spacing(3);
                    parecer.Item().Text($"3. PARECER DA GESTÃO — {statusTexto}").FontSize(9).Bold().FontColor(statusCor);

                    if (!string.IsNullOrWhiteSpace(nomeGestor))
                    {
                        parecer.Item().Text(t =>
                        {
                            t.Span("Autoridade Avaliadora: ").SemiBold();
                            t.Span(nomeGestor);
                        });
                    }

                    if (!string.IsNullOrEmpty(dataDespachoFormatada))
                    {
                        parecer.Item().Text(t =>
                        {
                            t.Span("Data do Despacho: ").SemiBold();
                            t.Span(dataDespachoFormatada);
                        });
                    }

                    if (!string.IsNullOrWhiteSpace(historico.MotivoDevolucao))
                    {
                        parecer.Item().PaddingTop(2).Text(t =>
                        {
                            t.Span("Justificativa / Observação: ").SemiBold();
                            t.Span(historico.MotivoDevolucao);
                        });
                    }
                });
            }

            // Assinatura
            column.Item().PaddingTop(32).AlignCenter().Width(260).Column(assinatura =>
            {
                assinatura.Item().LineHorizontal(1).LineColor(Colors.Black);
                assinatura.Item().PaddingTop(4).AlignCenter().Text("Assinatura do Ordenador de Despesas").FontSize(9.5f);
            });
        });
    }

    private void ComposeFooter(IContainer container)
    {
        var emissaoFormatada = DateTime.Now.ToString("dd/MM/yyyy HH:mm");

        container.Row(row =>
        {
            row.RelativeItem().Text("SICADI • Documento gerado eletronicamente").FontSize(8.5f).FontColor(Colors.Grey.Medium);
            row.RelativeItem().AlignRight().Text(x =>
            {
                x.Span("Emissão: ").FontSize(8.5f).FontColor(Colors.Grey.Medium);
                x.Span(emissaoFormatada).FontSize(8.5f).SemiBold().FontColor(Colors.Grey.Darken1);
            });
        });
    }

    private static (string texto, string corTexto, string corFundo) ObterEstiloStatus(StatusDiaria status)
    {
        return (int)status switch
        {
            1 => ("APROVADO", "#047857", "#ECFDF5"),
            2 => ("DEVOLVIDO P/ CORREÇÃO", "#1D4ED8", "#EFF6FF"),
            3 => ("REJEITADO", "#BE123C", "#FFF1F2"),
            _ => ("PENDENTE DE ANÁLISE", "#B45309", "#FFFBEB")
        };
    }
}