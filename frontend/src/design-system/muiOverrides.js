import { themes, staticTokens } from "./tokens";

/**
 * Overrides globais do Material UI v4, derivados dos tokens (ADR-0004).
 *
 * É a alavanca central do redesign: 211 dos 250 arquivos do frontend usam MUI
 * v4, e reescrever página a página levaria semanas. Padronizando aqui, botão,
 * input, tabela, modal e tabs ficam consistentes nas 44 telas de uma vez —
 * inclusive nas que ninguém abriu ainda.
 *
 * Regra do brief: um padrão por problema. Página que precisar de algo
 * diferente ajusta aqui, não cria estilo local.
 */
const overridesFromTokens = (mode = "light") => {
  const t = themes[mode] || themes.light;
  const s = staticTokens;

  return {
    MuiCssBaseline: {
      "@global": {
        body: {
          backgroundColor: t["surface-page"],
          color: t["text-primary"],
          fontFamily: s["font-sans"],
          fontSize: s["text-base"],
        },
        "*:focus-visible": {
          outline: `2px solid ${t["border-focus"]}`,
          outlineOffset: 1,
        },
      },
    },

    // Botões: altura 36, radius 6, sem sombra e sem deslocamento no hover.
    // O `translateY(-1px)` anterior era movimento decorativo — o tipo de
    // detalhe que faz a interface parecer improvisada.
    MuiButton: {
      root: {
        minHeight: 36,
        borderRadius: s["radius-md"],
        padding: "0 12px",
        fontSize: s["text-sm"],
        fontWeight: 500,
        textTransform: "none",
        letterSpacing: 0,
        boxShadow: "none",
        transition: "background-color 120ms ease, border-color 120ms ease",
      },
      contained: { boxShadow: "none", "&:hover": { boxShadow: "none" } },
      containedPrimary: {
        backgroundColor: t["brand-base"],
        color: t["on-brand"],
        "&:hover": { backgroundColor: t["brand-hover"], boxShadow: "none" },
      },
      outlined: {
        borderColor: t["border-input"],
        color: t["text-primary"],
        "&:hover": { borderColor: t["border-strong"], backgroundColor: t["surface-hover"] },
      },
      text: { color: t["text-secondary"], "&:hover": { backgroundColor: t["surface-hover"] } },
      sizeSmall: { minHeight: 30, fontSize: s["text-xs"], padding: "0 8px" },
      startIcon: { marginRight: 6, "& svg": { fontSize: 16 } },
      endIcon: { marginLeft: 6, "& svg": { fontSize: 16 } },
    },

    MuiIconButton: {
      root: {
        width: 36,
        height: 36,
        padding: 0,
        borderRadius: s["radius-md"],
        color: t["text-secondary"],
        "&:hover": { backgroundColor: t["surface-hover"], color: t["text-primary"] },
      },
      sizeSmall: { width: 30, height: 30 },
    },

    MuiOutlinedInput: {
      root: {
        borderRadius: s["radius-md"],
        backgroundColor: t["surface-raised"],
        fontSize: s["text-base"],
        "&:hover $notchedOutline": { borderColor: t["border-strong"] },
        "&$focused $notchedOutline": {
          borderColor: t["border-focus"],
          borderWidth: 1,
        },
        "&$focused": { boxShadow: s["ring-focus"] },
      },
      notchedOutline: { borderColor: t["border-input"] },
      input: { padding: "10px 12px" },
      inputMarginDense: { paddingTop: 9, paddingBottom: 9 },
    },

    MuiInputLabel: {
      outlined: { fontSize: s["text-base"], color: t["text-secondary"] },
    },

    MuiFormHelperText: { root: { fontSize: s["text-sm"], marginTop: 4 } },

    // Superfícies: elevação por borda, não por sombra. Sombra pesada é uma
    // das coisas que o brief pede para evitar.
    MuiPaper: {
      rounded: { borderRadius: s["radius-lg"] },
      elevation1: { boxShadow: "none", border: `1px solid ${t["border-default"]}` },
      elevation2: { boxShadow: s["shadow-sm"] },
      elevation4: { boxShadow: s["shadow-md"] },
      elevation8: { boxShadow: s["shadow-lg"] },
    },

    // Tabelas: cabeçalho discreto, linhas separadas por borda leve, densidade
    // confortável. Nada de linha virando card.
    MuiTableHead: {
      root: { backgroundColor: t["surface-subtle"] },
    },
    MuiTableCell: {
      root: {
        fontSize: s["text-sm"],
        padding: "10px 16px",
        borderBottom: `1px solid ${t["border-subtle"]}`,
        color: t["text-primary"],
      },
      head: {
        fontSize: s["text-xs"],
        fontWeight: 500,
        color: t["text-muted"],
        textTransform: "none",
        letterSpacing: 0,
        borderBottom: `1px solid ${t["border-default"]}`,
        whiteSpace: "nowrap",
      },
      sizeSmall: { padding: "8px 16px" },
    },
    MuiTableRow: {
      root: { "&:hover": { backgroundColor: t["surface-subtle"] } },
      head: { "&:hover": { backgroundColor: "transparent" } },
    },

    MuiTab: {
      root: {
        minHeight: 40,
        minWidth: 0,
        padding: "0 4px",
        marginRight: 20,
        textTransform: "none",
        fontSize: s["text-sm"],
        fontWeight: 500,
        color: t["text-secondary"],
        "&$selected": { color: t["text-primary"], fontWeight: 600 },
      },
    },
    MuiTabs: {
      root: { minHeight: 40, borderBottom: `1px solid ${t["border-default"]}` },
      indicator: { height: 2, backgroundColor: t["brand-base"] },
    },

    MuiDialog: {
      paper: {
        borderRadius: s["radius-lg"],
        border: `1px solid ${t["border-default"]}`,
        boxShadow: s["shadow-lg"],
      },
    },
    MuiDialogTitle: {
      root: {
        padding: "16px 20px",
        borderBottom: `1px solid ${t["border-subtle"]}`,
        "& .MuiTypography-root": { fontSize: s["text-md"], fontWeight: 600 },
      },
    },
    MuiDialogContent: { root: { padding: 20 } },
    MuiDialogActions: {
      root: { padding: "12px 20px", borderTop: `1px solid ${t["border-subtle"]}`, gap: 8 },
    },

    MuiMenu: {
      paper: {
        border: `1px solid ${t["border-default"]}`,
        boxShadow: s["shadow-lg"],
        borderRadius: s["radius-md"],
      },
    },
    MuiMenuItem: {
      root: {
        minHeight: 34,
        margin: "2px 4px",
        borderRadius: s["radius-sm"],
        fontSize: s["text-sm"],
        "&:hover": { backgroundColor: t["surface-hover"] },
      },
    },

    // Chips como rótulo de estado sóbrio, não badge saturada.
    MuiChip: {
      root: {
        height: 22,
        fontSize: s["text-xs"],
        fontWeight: 500,
        borderRadius: s["radius-sm"],
        backgroundColor: t["surface-sunken"],
        color: t["text-secondary"],
      },
      outlined: { borderColor: t["border-default"] },
      deleteIcon: { width: 15, height: 15 },
    },

    MuiTooltip: {
      tooltip: {
        backgroundColor: t["text-primary"],
        color: t["surface-raised"],
        fontSize: s["text-xs"],
        fontWeight: 400,
        borderRadius: s["radius-sm"],
        padding: "5px 8px",
      },
    },

    MuiDivider: { root: { backgroundColor: t["border-subtle"] } },

    MuiCard: {
      root: {
        border: `1px solid ${t["border-default"]}`,
        boxShadow: "none",
        borderRadius: s["radius-lg"],
      },
    },

    MuiAvatar: { root: { fontSize: s["text-sm"] } },

    MuiCheckbox: { root: { color: t["border-strong"], padding: 6 } },
    MuiRadio: { root: { color: t["border-strong"], padding: 6 } },
    MuiSwitch: { root: { padding: 8 } },

    MuiBadge: { badge: { fontSize: s["text-2xs"], height: 16, minWidth: 16 } },
  };
};

export const muiPropsDefaults = {
  MuiButton: { disableElevation: true, disableRipple: false },
  MuiTextField: { variant: "outlined", size: "small" },
  MuiPaper: { elevation: 1 },
  MuiTable: { size: "small" },
};

export default overridesFromTokens;
