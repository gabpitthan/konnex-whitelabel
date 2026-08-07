import React from "react";
import { makeStyles } from "@material-ui/core/styles";

/**
 * Cabeçalho de página, usado por 31 telas.
 *
 * Reescrito sobre os tokens (ADR-0004) em vez de criar um componente novo:
 * as páginas já o importam, então padronizar aqui alinha todas de uma vez sem
 * mexer em 31 arquivos — e sem deixar dois padrões de cabeçalho convivendo.
 */
const useStyles = makeStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: "var(--space-5)",
    minHeight: 40,
    padding: "0 0 var(--space-6)",
    borderBottom: "1px solid var(--border-default)",
    marginBottom: "var(--space-6)",
    flexShrink: 0,
    [theme.breakpoints.down("xs")]: {
      position: "sticky",
      top: 0,
      zIndex: "var(--z-sticky)",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "var(--space-3)",
      minHeight: "auto",
      padding: "var(--space-4) 0",
      marginBottom: "var(--space-5)",
      backgroundColor: "var(--surface-page)",
    },
  },
}));

const MainHeader = ({ children }) => {
  const classes = useStyles();
  return <header className={classes.header}>{children}</header>;
};

export default MainHeader;
