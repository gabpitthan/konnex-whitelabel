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

const useStyles = makeStyles((theme) => ({
  formContainer: {
    width: "100%",
    animation: "$enter .35s ease-out",
  },
  "@keyframes enter": {
    "0%": { opacity: 0, transform: "translateY(8px)" },
    "100%": { opacity: 1, transform: "translateY(0)" },
  },
  eyebrow: {
    display: "block",
    color: theme.palette.primary.main,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: ".12em",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  title: {
    margin: 0,
    color: theme.palette.text.primary,
    fontSize: 34,
    lineHeight: 1.12,
    letterSpacing: "-.035em",
    fontWeight: 650,
  },
  subtitle: {
    color: theme.palette.text.secondary,
    lineHeight: 1.6,
    margin: "12px 0 28px",
  },
  field: {
    marginBottom: 14,
    "& .MuiOutlinedInput-root": {
      borderRadius: 7,
      background: theme.palette.type === "dark" ? "#151f1b" : "#fff",
      transition: "border-color .15s ease, box-shadow .15s ease",
      "&.Mui-focused": { boxShadow: `0 0 0 3px ${theme.palette.primary.main}1c` },
    },
    "& .MuiInputAdornment-root": { color: theme.palette.text.secondary },
  },
  submitBtn: {
    marginTop: 18,
    background: theme.palette.primary.main,
    color: "#fff",
    borderRadius: 7,
    minHeight: 48,
    fontWeight: 700,
    textTransform: "none",
    width: "100%",
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: "0 7px 18px rgba(17,32,25,.14)",
    },
  },
  registerBtn: {
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.divider}`,
    background: "transparent",
    borderRadius: 7,
    minHeight: 46,
    fontWeight: 700,
    textTransform: "none",
    width: "100%",
    marginTop: 10,
    "&:hover": {
      background: theme.palette.action.hover,
    },
  },
  forgotPassword: {
    marginTop: 24,
    paddingTop: 20,
    borderTop: `1px solid ${theme.palette.divider}`,
    textAlign: "left",
  },
  forgotPasswordLink: {
    color: theme.palette.primary.main,
    textDecoration: "none",
    fontWeight: "500",
    "&:hover": {
      textDecoration: "underline",
    },
  },
  rememberMeContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
    minHeight: 42,
    "& .MuiTypography-root": { fontSize: 13, color: theme.palette.text.secondary },
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
