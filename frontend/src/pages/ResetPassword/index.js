import {
  Button,
  Grid,
  Link,
  TextField,
  Typography,
  LinearProgress,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React, { useState, useEffect } from "react";
import { Link as RouterLink, useLocation, useHistory } from "react-router-dom";
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
    margin: "10px 0",
  },
  subtitle: {
    color: theme.palette.text.secondary,
    lineHeight: 1.6,
    marginBottom: 26,
  },
  form: {
    width: "100%",
  },
  textField: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 7,
      background: theme.palette.type === "dark" ? "#151f1b" : "#fff",
      transition: "all 0.15s",
      "&.Mui-focused": {
        boxShadow: `0 0 0 3px ${theme.palette.primary.main}1c`,
      },
    },
    marginBottom: theme.spacing(2),
  },
  submitButton: {
    margin: theme.spacing(3, 0, 2),
    padding: theme.spacing(1.5),
    minHeight: 48,
    borderRadius: 7,
    background: theme.palette.primary.main,
    textTransform: "none",
    fontWeight: 600,
    fontSize: 14,
    position: "relative",
    overflow: "hidden",
    transition: "all 0.15s",
    "&:hover": {
      background: theme.palette.primary.dark,
      boxShadow: "0 7px 18px rgba(17,32,25,.14)",
    },
  },
  loadingBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "4px",
    "& .MuiLinearProgress-bar": {
      background: "rgba(255, 255, 255, 0.8)",
    },
  },
  sentAnimation: { background: "#267354" },
  link: {
    color: theme.palette.grey[700],
    textDecoration: "none",
    fontWeight: 600,
    transition: "color .15s",
    "&:hover": {
      color: theme.palette.primary.main,
    },
  },
  errorText: {
    color: theme.palette.error.main,
    padding: "12px 14px",
    borderLeft: `3px solid ${theme.palette.error.main}`,
    background: theme.palette.error.main + "0d",
    marginBottom: theme.spacing(2),
  },
  "@keyframes enter": {
    from: { opacity: 0, transform: "translateY(8px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
}));

const RedefinirSenha = () => {
  const classes = useStyles();
  const location = useLocation();
  const history = useHistory();
  const token = new URLSearchParams(location.search).get("token");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Token de redefinição ausente ou inválido. Por favor, solicite um novo link de redefinição.");
      console.error("No token found in URL:", location.search);
    } else {
      console.log("Token extracted from URL:", token);
    }
  }, [token, location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (senha !== confirmarSenha) {
      toast.error("As senhas não coincidem");
      setError("As senhas não coincidem");
      return;
    }
    if (senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setEnviando(true);

    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword: senha,
      });
      setEnviando(false);
      setEnviado(true);
      toast.success("Senha redefinida com sucesso");
      setTimeout(() => {
        setEnviado(false);
        history.push("/login");
      }, 2000);
    } catch (err) {
      setEnviando(false);
      const errorMessage = err.response?.data?.message || "Erro ao redefinir senha. Tente novamente.";
      setError(errorMessage);
      toastError(err);
    }
  };

  return (
    <AuthShell
      eyebrow="Credencial protegida"
      title="Um novo acesso."
      accent="A mesma operação."
      description="Defina uma credencial segura para continuar exatamente de onde parou."
      backTo="/login"
    >
            <div className={classes.formBox}>
              <span className={classes.eyebrow}>Nova credencial</span>
              <Typography component="h1" className={classes.title}>Crie uma nova senha</Typography>
              <Typography className={classes.subtitle}>
                Use pelo menos seis caracteres e confirme a nova senha abaixo.
              </Typography>
              {error && (
                <Typography className={classes.errorText}>
                  {error}
                </Typography>
              )}
              {token && (
                <form className={classes.form} noValidate onSubmit={handleSubmit}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    name="senha"
                    label="Nova Senha"
                    type="password"
                    id="senha"
                    autoComplete="new-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className={classes.textField}
                    disabled={enviando || enviado}
                  />
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    name="confirmarSenha"
                    label="Confirmar Senha"
                    type="password"
                    id="confirmarSenha"
                    autoComplete="new-password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className={classes.textField}
                    disabled={enviando || enviado}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    className={`${classes.submitButton} ${enviado ? classes.sentAnimation : ""}`}
                    disabled={enviando || enviado || !token}
                  >
                    {enviando
                      ? "Redefinindo..."
                      : enviado
                      ? "Redefinido!"
                      : "Redefinir Senha"}
                    {enviando && <LinearProgress className={classes.loadingBar} />}
                  </Button>
                  <Grid container justifyContent="center">
                    <Grid item>
                      <Link component={RouterLink} to="/login" className={classes.link}>
                        Voltar ao Login
                      </Link>
                    </Grid>
                  </Grid>
                </form>
              )}
            </div>
    </AuthShell>
  );
};

export default RedefinirSenha;
