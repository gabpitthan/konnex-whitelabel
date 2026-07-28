import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { makeStyles, useTheme } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    "--signal": theme.palette.primary.main,
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "minmax(320px, 0.82fr) minmax(480px, 1.18fr)",
    background: theme.palette.type === "dark" ? "#101714" : "#f2f4ef",
    color: theme.palette.type === "dark" ? "#f1f5ef" : "#17201c",
    [theme.breakpoints.down("sm")]: {
      display: "block",
      background: theme.palette.type === "dark" ? "#101714" : "#fbfcf8",
    },
  },
  narrative: {
    minHeight: "100vh",
    padding: "clamp(32px, 5vw, 72px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
    background: theme.palette.type === "dark" ? "#17211d" : "#18231f",
    color: "#f5f7f2",
    "&:after": {
      content: '""',
      position: "absolute",
      width: 360,
      height: 360,
      right: -170,
      bottom: "13%",
      border: "1px solid rgba(255,255,255,.11)",
      borderRadius: "50%",
      boxShadow: "0 0 0 56px rgba(255,255,255,.035), 0 0 0 112px rgba(255,255,255,.018)",
    },
    [theme.breakpoints.down("sm")]: {
      minHeight: 172,
      padding: "24px 22px 28px",
      justifyContent: "flex-start",
      "&:after": { width: 180, height: 180, right: -110, bottom: -90 },
    },
  },
  brand: {
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    position: "relative",
    zIndex: 1,
  },
  logo: {
    maxWidth: 132,
    maxHeight: 42,
    objectFit: "contain",
    objectPosition: "left center",
    filter: "brightness(0) invert(1)",
  },
  signalMark: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 3px)",
    alignItems: "end",
    gap: 3,
    height: 18,
    "& span": {
      width: 3,
      borderRadius: 3,
      background: "var(--signal)",
      "&:nth-child(1)": { height: 7 },
      "&:nth-child(2)": { height: 18 },
      "&:nth-child(3)": { height: 12 },
    },
  },
  narrativeBody: {
    position: "relative",
    zIndex: 1,
    maxWidth: 530,
    [theme.breakpoints.down("sm")]: { marginTop: 28 },
  },
  eyebrow: {
    color: "rgba(255,255,255,.58)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    marginBottom: 18,
    [theme.breakpoints.down("sm")]: { display: "none" },
  },
  statement: {
    fontSize: "clamp(34px, 4vw, 58px)",
    lineHeight: 1.03,
    letterSpacing: "-0.045em",
    fontWeight: 600,
    margin: 0,
    [theme.breakpoints.down("sm")]: { fontSize: 25, maxWidth: 320 },
  },
  statementAccent: {
    display: "block",
    color: "var(--signal)",
  },
  narrativeCopy: {
    maxWidth: 420,
    margin: "26px 0 0",
    color: "rgba(255,255,255,.66)",
    fontSize: 15,
    lineHeight: 1.65,
    [theme.breakpoints.down("sm")]: { display: "none" },
  },
  footer: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "rgba(255,255,255,.48)",
    fontSize: 12,
    "&:before": {
      content: '""',
      display: "block",
      width: 22,
      height: 1,
      background: "var(--signal)",
    },
    [theme.breakpoints.down("sm")]: { display: "none" },
  },
  content: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px clamp(28px, 7vw, 104px)",
    background: theme.palette.type === "dark" ? "#101714" : "#fbfcf8",
    [theme.breakpoints.down("sm")]: {
      minHeight: "calc(100vh - 172px)",
      alignItems: "flex-start",
      padding: "34px 22px 48px",
    },
  },
  inner: {
    width: "100%",
    maxWidth: 470,
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    color: theme.palette.text.secondary,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
    marginBottom: 34,
    "&:before": { content: '"←"', fontSize: 17 },
    "&:hover": { color: theme.palette.primary.main },
  },
}));

const AuthShell = ({
  children,
  eyebrow = "Operação conectada",
  title = "Conversas que fluem.",
  accent = "Times que avançam.",
  description = "Atendimento, automação e gestão reunidos em um espaço de trabalho claro e conectado.",
  backTo,
  backLabel = "Voltar para o acesso",
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const logo = theme.calculatedLogoLight ? theme.calculatedLogoLight() : "/logo.png";

  return (
    <main className={classes.root}>
      <section className={classes.narrative} aria-label="Konnex">
        <div className={classes.brand}>
          <span className={classes.signalMark} aria-hidden="true">
            <span /><span /><span />
          </span>
          <img className={classes.logo} src={logo} alt={theme.appName || "Konnex"} />
        </div>
        <div className={classes.narrativeBody}>
          <div className={classes.eyebrow}>{eyebrow}</div>
          <h1 className={classes.statement}>
            {title}
            <span className={classes.statementAccent}>{accent}</span>
          </h1>
          <p className={classes.narrativeCopy}>{description}</p>
        </div>
        <div className={classes.footer}>Konnex Signal Workspace</div>
      </section>
      <section className={classes.content}>
        <div className={classes.inner}>
          {backTo && (
            <RouterLink to={backTo} className={classes.backLink}>
              {backLabel}
            </RouterLink>
          )}
          {children}
        </div>
      </section>
    </main>
  );
};

export default AuthShell;
