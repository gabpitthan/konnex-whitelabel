import React from "react";
import { makeStyles } from "@material-ui/core/styles";

/**
 * Área de ações do cabeçalho de página. A ação primária fica por último, à
 * direita — posição consistente em todas as telas para o usuário não precisar
 * procurar a cada página.
 */
const useStyles = makeStyles((theme) => ({
  wrapper: {
    display: "flex",
    flex: "none",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: "var(--space-3)",
    marginLeft: "auto",
    "& > *": { margin: 0 },
    [theme.breakpoints.down("xs")]: {
      minWidth: 0,
      maxWidth: "100%",
      flexWrap: "nowrap",
      overflowX: "auto",
      overscrollBehaviorX: "contain",
      WebkitOverflowScrolling: "touch",
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" },
      "& > *": { flex: "0 0 auto" },
      // Alvo de toque adequado no celular.
      "& > button, & > * > button": { minHeight: 40 },
    },
  },
}));

const MainHeaderButtonsWrapper = ({ children }) => {
  const classes = useStyles();
  return <div className={classes.wrapper}>{children}</div>;
};

export default MainHeaderButtonsWrapper;
