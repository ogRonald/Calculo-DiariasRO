namespace DiariasRO.Domain.Strategies;

public interface IRegraDiariaStrategy
{
    decimal AplicarFator(int diaAtual, decimal valorUnitarioBase);
}

public class RegraPadraoStrategy : IRegraDiariaStrategy
{
    public decimal AplicarFator(int diaAtual, decimal valorUnitarioBase) => valorUnitarioBase;
}

public class RegraCursoLongoStrategy : IRegraDiariaStrategy
{
    public decimal AplicarFator(int diaAtual, decimal valorUnitarioBase)
    {
        return diaAtual >= 16 ? valorUnitarioBase * 0.50m : valorUnitarioBase;
    }
}

public class RegraReducaoCinquentaPercentualStrategy : IRegraDiariaStrategy
{
    public decimal AplicarFator(int diaAtual, decimal valorUnitarioBase) => valorUnitarioBase * 0.50m;
}