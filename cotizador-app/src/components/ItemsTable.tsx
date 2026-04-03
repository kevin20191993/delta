import { QuotationItem } from '../types/quotation';
import { clampNumber, toMoney } from '../lib/format';

interface ItemsTableProps {
  items: QuotationItem[];
  currency: 'MXN' | 'USD';
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onMoveItem: (index: number, direction: 'up' | 'down') => void;
  onUpdateItem: <K extends keyof QuotationItem>(index: number, key: K, value: QuotationItem[K]) => void;
}

export default function ItemsTable({
  items,
  currency,
  onAddItem,
  onRemoveItem,
  onMoveItem,
  onUpdateItem
}: ItemsTableProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel animate-liftIn [animation-delay:80ms]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-ink">Partidas</h2>
          <p className="text-sm text-slate">Agrega, edita y ordena conceptos tecnicos.</p>
        </div>
        <button
          type="button"
          onClick={onAddItem}
          className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
        >
          + Partida
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[960px] w-full border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="bg-ink text-white">
              <th className="rounded-l-lg px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Descripcion tecnica</th>
              <th className="px-3 py-2 text-left">Cant.</th>
              <th className="px-3 py-2 text-left">Unidad</th>
              <th className="px-3 py-2 text-left">P. Unitario</th>
              <th className="px-3 py-2 text-left">Importe</th>
              <th className="rounded-r-lg px-3 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const amount = clampNumber(item.quantity, 0) * clampNumber(item.unitPrice, 0);
              return (
                <tr key={`${item.id}-${index}`} className="bg-pearl text-ink">
                  <td className="px-2 py-2">
                    <input
                      value={item.id}
                      onChange={(event) => onUpdateItem(index, 'id', event.target.value)}
                      className="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 outline-none focus:border-steel"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <textarea
                      value={item.description}
                      onChange={(event) => onUpdateItem(index, 'description', event.target.value)}
                      className="h-16 w-full rounded-md border border-slate-300 bg-white px-2 py-1 outline-none focus:border-steel"
                      maxLength={300}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={item.quantity}
                      onChange={(event) => onUpdateItem(index, 'quantity', Number(event.target.value))}
                      className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 outline-none focus:border-steel"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={item.unit}
                      onChange={(event) => onUpdateItem(index, 'unit', event.target.value)}
                      className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 outline-none focus:border-steel"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitPrice}
                      onChange={(event) => onUpdateItem(index, 'unitPrice', Number(event.target.value))}
                      className="w-32 rounded-md border border-slate-300 bg-white px-2 py-1 outline-none focus:border-steel"
                    />
                  </td>
                  <td className="px-2 py-2 text-right font-semibold">{toMoney(amount, currency)}</td>
                  <td className="px-2 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onMoveItem(index, 'up')}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs text-ink disabled:opacity-40"
                        disabled={index === 0}
                      >
                        Arriba
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveItem(index, 'down')}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs text-ink disabled:opacity-40"
                        disabled={index === items.length - 1}
                      >
                        Abajo
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(index)}
                        className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700"
                        disabled={items.length === 1}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
