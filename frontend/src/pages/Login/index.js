import React, { useState, useEffect, useContext } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Button, TextField, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { IconButton, InputAdornment, Switch } from "@mui/material";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import EmailIcon from "@material-ui/icons/Email";
import LockIcon from "@material-ui/icons/Lock";
import { Helmet } from "react-helmet";
import { AuthContext } from "../../context/Auth/AuthContext";
import AuthShell from "./AuthShell";

const useStyles = makeStyles(() => ({
  formContainer: {
    width: "100%",
    animation: "$enter var(--duration-slow) var(--ease-out)",
  },
  "@keyframes enter": {
    "0%": { opacity: 0, transform: "translateY(6px)" },
    "100%": { opacity: 1, transform: "translateY(0)" },
  },
  "@media (prefers-reduced-motion: reduce)": {
    formContainer: { animation: "none" },
  },
  eyebrow: {
    display: "block",
    color: "var(--text-brand)",
    fontSize: "var(--text-xs)",
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "var(--space-5)",
  },
  title: {
    margin: 0,
    color: "var(--text-primary)",
    fontSize: "var(--text-3xl)",
    lineHeight: 1.15,
    letterSpacing: "var(--tracking-tight)",
    fontWeight: 700,
  },
  subtitle: {
    color: "var(--text-secondary)",
    fontSize: "var(--text-md)",
    lineHeight: "var(--leading-relaxed)",
    margin: "var(--space-5) 0 var(--space-9)",
  },
  field: {
    marginBottom: "var(--space-5)",
    "& .MuiOutlinedInput-root": {
      borderRadius: "var(--radius-md)",
      background: "var(--surface-raised)",
      fontSize: "var(--text-md)",
      transition: "border-color var(--duration-fast) var(--ease-standard)",
    },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-input)" },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--border-strong)",
    },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--border-focus)",
      borderWidth: 2,
    },
    "& .MuiInputLabel-root": { fontSize: "var(--text-md)", color: "var(--text-secondary)" },
    "& .MuiInputAdornment-root": { color: "var(--text-muted)" },
  },
  submitBtn: {
    marginTop: "var(--space-6)",
    background: "var(--brand-base)",
    color: "var(--on-brand)",
    borderRadius: "var(--radius-md)",
    minHeight: 42,
    fontSize: "var(--text-md)",
    fontWeight: 600,
    textTransform: "none",
    width: "100%",
    boxShadow: "none",
    "&:hover": { backgroundColor: "var(--brand-hover)", boxShadow: "none" },
  },
  registerBtn: {
    color: "var(--text-primary)",
    border: "1px solid var(--border-input)",
    background: "transparent",
    borderRadius: "var(--radius-md)",
    minHeight: 42,
    fontSize: "var(--text-md)",
    fontWeight: 600,
    textTransform: "none",
    width: "100%",
    marginTop: "var(--space-4)",
    "&:hover": { background: "var(--surface-hover)" },
  },
  forgotPassword: {
    marginTop: "var(--space-8)",
    paddingTop: "var(--space-6)",
    borderTop: "1px solid var(--border-subtle)",
    textAlign: "left",
    fontSize: "var(--text-sm)",
  },
  forgotPasswordLink: {
    color: "var(--text-brand)",
    textDecoration: "none",
    fontWeight: 600,
    "&:hover": { textDecoration: "underline" },
  },
  rememberMeContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "var(--space-1)",
    minHeight: 38,
    "& .MuiTypography-root": { fontSize: "var(--text-base)", color: "var(--text-secondary)" },
  },
}));

const Login = () => {
  const classes = useStyles();
  const { handleLogin } = useContext(AuthContext);
  const [user, setUser] = useState({ email: "", password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [userCreationEnabled, setUserCreationEnabled] = useState(true);

  const backendUrl =
    process.env.REACT_APP_BACKEND_URL === "https://localhost:8090"
      ? "https://localhost:8090"
      : process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const fetchUserCreationStatus = async () => {
      try {
        const response = await fetch(`${backendUrl}/settings/userCreation`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user creation status");
        }

        const data = await response.json();
        setUserCreationEnabled(data.userCreation === "enabled");
      } catch (err) {
        console.error("Erro ao verificar userCreation:", err);
        setUserCreationEnabled(false);
      }
    };

    fetchUserCreationStatus();
  }, [backendUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(user);
  };

  return (
    <>
      <Helmet>
        <title>Login</title>
      </Helmet>

      <AuthShell>
          <form className={classes.formContainer} onSubmit={handleSubmit}>
            <span className={classes.eyebrow}>Acesso seguro</span>
            <h2 className={classes.title}>Bem-vindo de volta.</h2>
            <Typography className={classes.subtitle}>
              Entre no seu espaço de trabalho para continuar a operação.
            </Typography>
            {error && <Typography color="error">{error}</Typography>}
            <TextField
              label="E-mail"
              variant="outlined"
              fullWidth
              className={classes.field}
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Senha"
              variant="outlined"
              fullWidth
              className={classes.field}
              type={showPassword ? "text" : "password"}
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <div className={classes.rememberMeContainer}>
              <Switch
                checked={user.remember}
                onChange={(e) => setUser({ ...user, remember: e.target.checked })}
                name="remember"
                color="primary"
              />
              <Typography>Lembrar de mim</Typography>
            </div>
            <div>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                className={classes.submitBtn}
              >
                Entrar
              </Button>
              {userCreationEnabled && (
                <Button
                  component={RouterLink}
                  to="/signup"
                  variant="contained"
                  className={classes.registerBtn}
                >
                  Cadastre-se
                </Button>
              )}
            </div>
            <div className={classes.forgotPassword}>
              <RouterLink
                to="/forgot-password"
                className={classes.forgotPasswordLink}
              >
                Esqueceu a senha?
              </RouterLink>
            </div>
          </form>
      </AuthShell>
    </>
  );
};

export default Login;
