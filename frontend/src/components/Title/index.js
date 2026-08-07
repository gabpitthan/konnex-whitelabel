import React from "react";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

/**
 * Título de página.
 *
 * 20px semibold, não 1.35rem bold. O brief é explícito: dentro do sistema o
 * título orienta, não impressiona — títulos grandes pertencem à landing page.
 */
const useStyles = makeStyles((theme) => ({
  title: {
    flex: "1 1 auto",
    minWidth: 0,
    margin: 0,
    color: "var(--text-primary)",
    fontSize: "var(--text-xl)",
    fontWeight: 600,
    lineHeight: "var(--leading-tight)",
    letterSpacing: "var(--tracking-tight)",
    [theme.breakpoints.down("xs")]: {
      width: "100%",
      fontSize: "var(--text-lg)",
    },
  },
}));

export default function Title({ children, className, ...props }) {
  const classes = useStyles();
  return (
    <Typography
      variant="h5"
      component="h1"
      className={`${classes.title} ${className || ""}`}
      {...props}
    >
      {children}
    </Typography>
  );
}
