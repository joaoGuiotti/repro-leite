# UI Components Contract: Reusable Rural Primitives (`src/ui`)

**Feature**: `002-inseminacao-rapida`  
**Date**: 2026-10-14  

Este contrato documenta a API e o comportamento das 4 novas primitivas reutilizáveis de interface especificadas para `src/ui/`, projetadas com alto contraste solar, alvos de toque mínimos de 48px/56px e classes estáticas do Tailwind (NativeWind v4).

---

## 1. `BannerAlerta.tsx` (`src/ui/BannerAlerta.tsx`)

Componente de aviso contextual de alto impacto para mensagens zootécnicas críticas (consanguinidade, estoque zerado, re-inseminação de vaca prenhe).

### Props Interface

```typescript
export type BannerAlertaVariante = 'alerta' | 'atencao' | 'sucesso' | 'info';

export interface BannerAlertaProps {
  variante?: BannerAlertaVariante; // Padrão: 'atencao' (âmbar)
  titulo: string;
  mensagem: string;
  icone?: React.ReactNode;
  textoAcao?: string; // Ex.: "Prosseguir mesmo assim", "+ Adicionar Doses"
  onAcao?: () => void;
  onFechar?: () => void;
  className?: string;
}
```

### Comportamento Visual
- **Variante `atencao`**: Borda `border-ambar-300`, fundo `bg-ambar-50`, texto do título `text-ambar-900`, texto do corpo `text-ambar-800`.
- **Variante `alerta`**: Borda `border-alerta-300`, fundo `bg-alerta-50`, texto `text-alerta-900`.
- **Botão de Ação**: Altura mínima de 48px (`min-h-12`), contraste de 7:1 sob sol forte.

---

## 2. `PainelProjecaoZootecnica.tsx` (`src/ui/PainelProjecaoZootecnica.tsx`)

Grid de 4 cartões legíveis que resume os marcos reprodutivos imediatos do ciclo da vaca.

### Props Interface

```typescript
export interface PainelProjecaoZootecnicaProps {
  dataIA: string; // ISO YYYY-MM-DD
  retornoCioData: string; // YYYY-MM-DD
  toqueData: string; // YYYY-MM-DD
  partoPrevistoData: string; // YYYY-MM-DD
  secagemData: string; // YYYY-MM-DD
  className?: string;
}
```

### Comportamento Visual
- Grid responsivo de 2 colunas no celular.
- Cada cartão possui:
  - Ícone de `lucide-react-native` (`Calendar`, `Stethoscope`, `Baby`, `PauseCircle`).
  - Título do marco em caixa alta leve (`VIGIAR CIO`, `TOQUE VET`, `PARTO PREVISTO`, `SECAGEM`).
  - Data em formato brasileiro `DD/MM/AAAA` em fonte semibold grande (`text-lg text-gray-900`).
  - Pílula de contagem de dias relativos (`+21d`, `+45d`, `+282d`, `-60d`).

---

## 3. `SeletorItemModal.tsx` (`src/ui/SeletorItemModal.tsx`)

Modal com busca instantânea, teclado numérico ou alfanumérico, suporte a pílulas de filtro rápido de status e rolagem com toque rural.

### Props Interface

```typescript
export interface ItemSeletor {
  id: string;
  tituloPrincipal: string; // Ex.: "Brinco 102" ou "Touro Jaguar TE"
  subtitulo?: string; // Ex.: "Mimosa · Holandesa" ou "Gir Leiteiro · GIR-8821"
  badgeTexto?: string; // Ex.: "Vazia", "12 doses"
  badgeVariante?: 'sucesso' | 'atencao' | 'alerta' | 'neutro';
  disabled?: boolean;
}

export interface FiltroOpcao {
  id: string;
  label: string;
}

export interface SeletorItemModalProps {
  visivel: boolean;
  onFechar: () => void;
  onSelecionar: (item: ItemSeletor) => void;
  tituloModal: string; // Ex.: "Selecionar Fêmea para Inseminar"
  placeholderBusca: string; // Ex.: "Digitar número do brinco..."
  tipoTeclado?: 'numeric' | 'default';
  itens: ItemSeletor[];
  filtros?: FiltroOpcao[];
  filtroAtivo?: string;
  onMudarFiltro?: (filtroId: string) => void;
  itemSelecionadoId?: string | null;
  rodapeCustomizado?: React.ReactNode;
}
```

### Comportamento Visual
- Montado sobre o `ModalPadrao` já existente em `src/ui/`.
- Itens da lista com altura mínima de 56px (`min-h-14`) para toque fácil no tronco de contenção.

---

## 4. `BadgeEstoqueDoses.tsx` (`src/ui/BadgeEstoqueDoses.tsx`)

Pílula compacta de status de estoque de sêmen com semântica de cores zootécnicas.

### Props Interface

```typescript
export interface BadgeEstoqueDosesProps {
  saldoDoses: number;
  className?: string;
}
```

### Comportamento Visual
- `saldoDoses > 3`: `bg-pasto-100 text-pasto-800` (disponibilidade saudável).
- `saldoDoses >= 1 && saldoDoses <= 3`: `bg-ambar-100 text-ambar-800` (estoque baixo).
- `saldoDoses === 0`: `bg-alerta-100 text-alerta-800` (estoque zerado).
