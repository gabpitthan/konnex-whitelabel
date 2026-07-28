import React, { useState, useEffect } from "react";
import qs from "query-string";
import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik, Form, Field } from "formik";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import usePlans from "../../hooks/usePlans";
import { i18n } from "../../translate/i18n";
import { FormControl } from "@material-ui/core";
import { InputLabel, MenuItem, Select } from "@material-ui/core";
import { openApi } from "../../services/api";
import toastError from "../../errors/toastError";
import AuthShell from "../Login/AuthShell";

const useStyles = makeStyles((theme) => ({
  paper: {
    width: "100%",
    animation: "$enter .35s ease-out",
  },
  "@keyframes enter": {
    from: { opacity: 0, transform: "translateY(8px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  eyebrow: {
    color: theme.palette.primary.main,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: ".12em",
    textTransform: "uppercase",
  },
  title: {
    margin: "10px 0 8px",
    fontSize: 32,
    fontWeight: 650,
    letterSpacing: "-.035em",
    color: theme.palette.text.primary,
  },
  subtitle: {
    color: theme.palette.text.secondary,
    lineHeight: 1.55,
    marginBottom: 24,
  },
  form: {
    width: "100%",
    "& .MuiOutlinedInput-root": {
      borderRadius: 7,
      background: theme.palette.type === "dark" ? "#151f1b" : "#fff",
      "&.Mui-focused": { boxShadow: `0 0 0 3px ${theme.palette.primary.main}1c` },
    },
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
    minHeight: 48,
    borderRadius: 7,
    textTransform: "none",
    fontWeight: 700,
  },
  loginLink: {
    color: theme.palette.primary.main,
    fontWeight: 600,
    textDecoration: "none",
  },
}));

const UserSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
  companyName: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
  password: Yup.string().min(5, "Too Short!").max(50, "Too Long!"),
  email: Yup.string().email("Invalid email").required("Required"),
  phone: Yup.string().required("Required"),
});

const SignUp = () => {
  const classes = useStyles();
  const history = useHistory();
  const { getPlanList } = usePlans();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userCreationEnabled, setUserCreationEnabled] = useState(true);

  let companyId = null;
  const params = qs.parse(window.location.search);
  if (params.companyId !== undefined) {
    companyId = params.companyId;
  }

  const initialState = {
    name: "",
    email: "",
    password: "",
    phone: "",
    companyId,
    companyName: "",
    planId: "",
  };

  const [user] = useState(initialState);

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
        const isEnabled = data.userCreation === "enabled";
        setUserCreationEnabled(isEnabled);

        if (!isEnabled) {
          toast.info("Cadastro de novos usuários está desabilitado.");
          history.push("/login");
        }
      } catch (err) {
        console.error("Erro ao verificar userCreation:", err);
        setUserCreationEnabled(false);
        toast.error("Erro ao verificar permissão de cadastro.");
        history.push("/login");
      }
    };

    fetchUserCreationStatus();
  }, [backendUrl, history]);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      const planList = await getPlanList({ listPublic: "false" });
      setPlans(planList);
      setLoading(false);
    };
    fetchData();
  }, [getPlanList]);

  const handleSignUp = async (values) => {
    try {
      await openApi.post("/auth/signup", values);
      toast.success(i18n.t("signup.toasts.success"));
      history.push("/login");
    } catch (err) {
      toastError(err);
    }
  };

  if (!userCreationEnabled) {
    return null;
  }

  return (
    <AuthShell
      eyebrow="Novo espaço de trabalho"
      title="Comece organizado."
      accent="Cresça conectado."
      description="Configure sua operação e reúna equipe, canais e automações em um único fluxo."
      backTo="/login"
    >
      <div className={classes.paper}>
        <span className={classes.eyebrow}>Criar conta</span>
        <Typography component="h1" className={classes.title}>
          {i18n.t("signup.title")}
        </Typography>
        <Typography className={classes.subtitle}>
          Informe os dados essenciais. Você poderá configurar os detalhes da operação depois.
        </Typography>
        <Formik
          initialValues={user}
          enableReinitialize={true}
          validationSchema={UserSchema}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleSignUp(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
          {({ touched, errors, isSubmitting }) => (
            <Form className={classes.form}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    variant="outlined"
                    fullWidth
                    id="companyName"
                    label={i18n.t("signup.form.company")}
                    error={touched.companyName && Boolean(errors.companyName)}
                    helperText={touched.companyName && errors.companyName}
                    name="companyName"
                    autoComplete="companyName"
                    autoFocus
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    autoComplete="name"
                    name="name"
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    variant="outlined"
                    fullWidth
                    id="name"
                    label={i18n.t("signup.form.name")}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    variant="outlined"
                    fullWidth
                    id="email"
                    label={i18n.t("signup.form.email")}
                    name="email"
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    autoComplete="email"
                    inputProps={{ style: { textTransform: "lowercase" } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    variant="outlined"
                    fullWidth
                    name="password"
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                    label={i18n.t("signup.form.password")}
                    type="password"
                    id="password"
                    autoComplete="current-password"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    variant="outlined"
                    fullWidth
                    id="phone"
                    label={i18n.t("signup.form.phone")}
                    name="phone"
                    autoComplete="phone"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="plan-selection-label">Plano</InputLabel>
                    <Field
                      as={Select}
                      labelId="plan-selection-label"
                      id="plan-selection"
                      name="planId"
                      label="Plano"
                      required
                    >
                      {plans.map((plan, key) => (
                        <MenuItem key={key} value={plan.id}>
                          {plan.name} - Atendentes: {plan.users} - WhatsApp: {plan.connections} - Filas: {plan.queues} - R$ {plan.amount}
                        </MenuItem>
                      ))}
                    </Field>
                  </FormControl>
                </Grid>
              </Grid>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
              >
                {i18n.t("signup.buttons.submit")}
              </Button>
              <Grid container justifyContent="center">
                <Grid item>
                  <Link
                    variant="body2"
                    component={RouterLink}
                    to="/login"
                    className={classes.loginLink}
                  >
                    {i18n.t("signup.buttons.login")}
                  </Link>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </div>
    </AuthShell>
  );
};

export default SignUp;
