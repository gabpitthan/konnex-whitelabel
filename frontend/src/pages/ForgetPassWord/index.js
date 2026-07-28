import {
  Button,
  Grid,
  Link,
  TextField,
  Typography,
  LinearProgress,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import AuthShell from "../Login/AuthShell";

const useStyles = makeStyles((theme) => ({
  formBox: {
    width: "100%",
    animation: "$enter .35s ease-out",
  },
  eyebrow: {
    color: theme.palette.primary.main,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: ".12em",
    textTransform: "uppercase",
  },
  title: {
    color: theme.palette.text.primary,
    fontWeight: 650,
    fontSize: 34,
    letterSpacing: "-.035em",
    margin: "10px 0 10px",
  },
  subtitle: {
    color: theme.palette.text.secondary,
    lineHeight: 1.6,
    marginBottom: 26,
  },
  form: {
    width: '100%',
  },
  textField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      background: theme.palette.type === "dark" ? "#151f1b" : "#fff",
      transition: 'all 0.15s',
      '&.Mui-focused': {
        boxShadow: `0 0 0 3px ${theme.palette.primary.main}1c`,
      },
    },
  },
  submitButton: {
    margin: theme.spacing(3, 0, 2),
    padding: theme.spacing(1.5),
    minHeight: 48,
    borderRadius: 7,
    background: theme.palette.primary.main,
    textTransform: 'none',
    fontWeight: 600,
    fontSize: 14,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.15s',
    '&:hover': {
      background: theme.palette.primary.dark,
      boxShadow: '0 7px 18px rgba(17,32,25,.14)',
    },
  },
  loadingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '4px',
    '& .MuiLinearProgress-bar': {
      background: 'rgba(255, 255, 255, 0.8)',
    },
  },
  sentAnimation: { background: "#267354" },
  link: {
    color: theme.palette.grey[700],
    textDecoration: 'none',
    fontWeight: 600,
    transition: 'color 0.15s',
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  "@keyframes enter": {
    from: { opacity: 0, transform: "translateY(8px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
}));

const EsqueciSenha = () => {
  const classes = useStyles();
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setEnviando(false);
      setEnviado(true);
      toast.success("Link de redefinição de senha enviado com sucesso");
      setTimeout(() => setEnviado(false), 2000); // Reset após 2 segundos
    } catch (err) {
      setEnviando(false);
      toastError(err);
    }
  };

  return (
    <AuthShell
      eyebrow="Recuperação segura"
      title="Retome o acesso."
      accent="Sem perder o ritmo."
      description="Enviaremos um caminho seguro para você voltar ao seu espaço de trabalho."
      backTo="/login"
    >
            <div className={classes.formBox}>
              <span className={classes.eyebrow}>Recuperar acesso</span>
              <Typography component="h1" className={classes.title}>Esqueceu sua senha?</Typography>
              <Typography className={classes.subtitle}>
                Informe o e-mail da conta. Você receberá as instruções para criar uma nova senha.
              </Typography>
              <form className={classes.form} noValidate onSubmit={handleSubmit}>
                <TextField
                  variant="outlined"
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Digite seu e-mail"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={classes.textField}
                  disabled={enviando}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  className={`${classes.submitButton} ${enviado ? classes.sentAnimation : ''}`}
                  disabled={enviando || enviado}
                >
                  {enviando ? "Enviando..." : enviado ? "Enviado!" : "Enviar Link de Redefinição"}
                  {enviando && (
                    <LinearProgress className={classes.loadingBar} />
                  )}
                </Button>
                <Grid container justifyContent="center">
                  <Grid item>
                    <Link
                      component={RouterLink}
                      to="/login"
                      className={classes.link}
                    >
                      Voltar ao Login
                    </Link>
                  </Grid>
                </Grid>
              </form>
            </div>
    </AuthShell>
  );
};

export default EsqueciSenha;
