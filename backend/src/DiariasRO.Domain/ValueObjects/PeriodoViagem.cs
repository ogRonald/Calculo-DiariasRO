namespace DiariasRO.Domain.ValueObjects;

public readonly record struct PeriodoViagem
{
    public DateTime DataHoraInicio { get; }
    public DateTime DataHoraFim { get; }

    public PeriodoViagem(DateTime inicio, DateTime fim)
    {
        if (fim <= inicio)
            throw new ArgumentException("A data/hora de fim deve ser posterior ao início.");

        DataHoraInicio = inicio;
        DataHoraFim = fim;
    }

    public double TotalHoras => (DataHoraFim - DataHoraInicio).TotalHours;

    public int TotalDiasCalculados
    {
        get
        {
            var dias = (int)(TotalHoras / 24);
            var restoHoras = TotalHoras % 24;
            return restoHoras >= 5 ? dias + 1 : dias;
        }
    }
}