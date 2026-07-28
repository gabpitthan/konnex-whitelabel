import React, { useState, useContext, useEffect, useMemo } from "react";
import clsx from "clsx";
import { useLocation } from "react-router-dom";
// import moment from "moment";

// import { isNill } from "lodash";
// import SoftPhone from "react-softphone";
// import { WebSocketInterface } from "jssip";

import {
  makeStyles,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  MenuItem,
  IconButton,
  Menu,
  useTheme,
  useMediaQuery,
  Avatar,
  // FormControl,
  Badge,
  withStyles,
  Chip,
} from "@material-ui/core";

import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
// import AccountCircle from "@material-ui/icons/AccountCircle";
import CachedIcon from "@material-ui/icons/Cached";
// import whatsappIcon from "../assets/nopicture.png";

import MainListItems from "./MainListItems";
import NotificationsPopOver from "../components/NotificationsPopOver";
import NotificationsVolume from "../components/NotificationsVolume";
import UserModal from "../components/UserModal";
import { AuthContext } from "../context/Auth/AuthContext";
import BackdropLoading from "../components/BackdropLoading";
// import DarkMode from "../components/DarkMode";
import { i18n } from "../translate/i18n";
import toastError from "../errors/toastError";
import AnnouncementsPopover from "../components/AnnouncementsPopover";

import logo from "../assets/logo.png";
import logoDark from "../assets/logo-black.png";
import ChatPopover from "../pages/Chat/ChatPopover";

import UserLanguageSelector from "../components/UserLanguageSelector";

import ColorModeContext from "./themeContext";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import { getBackendUrl } from "../config";
import useSettings from "../hooks/useSettings";
import VersionControl from "../components/VersionControl";

// import { SocketContext } from "../context/Socket/SocketContext";

const backendUrl = getBackendUrl();

const drawerWidth = 264;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "100dvh",
    [theme.breakpoints.down("sm")]: {
      height: "100dvh",
    },
    backgroundColor: theme.palette.fancyBackground,
    "& .MuiButton-outlinedPrimary": {
      color: theme.palette.primary,
      border:
        theme.mode === "light"
          ? "1px solid rgba(0 124 102)"
          : "1px solid rgba(255, 255, 255, 0.5)",
    },
    "& .MuiTab-textColorPrimary.Mui-selected": {
      color: theme.palette.primary,
    },
  },
  chip: {
    background: "red",
    color: "white",
  },
  avatar: {
    width: "100%",
  },
  toolbar: {
    minHeight: 64,
    padding: "0 18px",
    color: theme.palette.text.primary,
    background: theme.palette.barraSuperior,
    borderBottom: `1px solid ${theme.palette.divider}`,
    gap: 4,
    [theme.breakpoints.down("sm")]: {
      minHeight: 56,
      padding: "0 10px",
    },
  },
  toolbarIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    // backgroundColor: "#FFF",
    backgroundSize: "cover",
    padding: "0 12px 0 18px",
    minHeight: "64px",
    borderBottom: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.down("sm")]: {
      height: "56px",
      minHeight: "56px",
    },
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    boxShadow: "none",
    background: theme.palette.background.paper,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  // menuButton: {
  //   marginRight: 36,
  // },
  menuButtonHidden: {
    display: "none",
  },
  title: {
    flexGrow: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: 720,
    letterSpacing: "-0.01em",
    color: theme.palette.text.primary,
  },
  drawerPaper: {
    position: "relative",
    whiteSpace: "nowrap",
    // overflowX: "hidden",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: "hidden",
    overflowY: "hidden",
    background: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
  },

  drawerPaperClose: {
    overflowX: "hidden",
    overflowY: "hidden",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up("sm")]: {
      width: theme.spacing(9),
    },
  },

  appBarSpacer: {
    minHeight: "64px",
    [theme.breakpoints.down("sm")]: {
      minHeight: "56px",
    },
  },
  content: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    position: "relative",
    background: theme.palette.background.default,
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  // paper: {
  //     padding: theme.spacing(2),
  //     display: "flex",
  //     overflow: "visible", position: "relative",
  //     flexDirection: "column",
  //   },
  containerWithScroll: {
    flex: 1,
    // padding: theme.spacing(1),
    overflowY: "auto",
    overflowX: "hidden", // Oculta a barra de rolagem horizontal
    ...theme.scrollbarStyles,
    padding: "10px 8px 14px",
  },
  NotificationsPopOver: {
    // color: theme.barraSuperior.secondary.main,
  },
  logo: {
    width: "auto",
    height: "34px",
    maxWidth: 164,
    objectFit: "contain",
    [theme.breakpoints.down("sm")]: {
      width: "auto",
      height: "100%",
      maxWidth: 180,
    },
    logo: theme.logo,
    content: "url(" + (theme.mode === "light" ? theme.calculatedLogoLight() : theme.calculatedLogoDark()) + ")"
  },
  hideLogo: {
    display: "none",
  },
  avatar2: {
    width: theme.spacing(4),
    height: theme.spacing(4),
    cursor: "pointer",
    borderRadius: "50%",
    border: `2px solid ${theme.palette.background.paper}`,
    boxShadow: `0 0 0 1px ${theme.palette.divider}`,
  },
  toolbarSecondary: {
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  mobileOnly: {
    display: "none",
    [theme.breakpoints.down("sm")]: {
      display: "inline-flex",
    },
  },
  signalMark: {
    width: 3,
    height: 24,
    marginRight: 10,
    borderRadius: 4,
    background: "#16856f",
  },
  pageContext: {
    display: "flex",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  companyContext: {
    display: "block",
    overflow: "hidden",
    color: theme.palette.text.secondary,
    fontSize: 11,
    fontWeight: 620,
    letterSpacing: ".03em",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  accountButton: {
    marginLeft: 6,
  },
  updateDiv: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
}));

const StyledBadge = withStyles((theme) => ({
  badge: {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "$ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}))(Badge);

const SmallAvatar = withStyles((theme) => ({
  root: {
    width: 22,
    height: 22,
    border: `2px solid ${theme.palette.background.paper}`,
  },
}))(Avatar);

const LoggedInLayout = ({ children, themeToggle }) => {
  const classes = useStyles();
  const [userToken, setUserToken] = useState("disabled");
  const [loadingUserToken, setLoadingUserToken] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { handleLogout, loading } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVariant, setDrawerVariant] = useState("permanent");
  // const [dueDate, setDueDate] = useState("");
  //   const socketManager = useContext(SocketContext);
  const { user, socket } = useContext(AuthContext);

  const theme = useTheme();
  const location = useLocation();
  const { colorMode } = useContext(ColorModeContext);
  const greaterThenSm = useMediaQuery(theme.breakpoints.up("sm"));

  const [volume, setVolume] = useState(localStorage.getItem("volume") || 1);

  const [profileUrl, setProfileUrl] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mainListItems = useMemo(
    () => <MainListItems drawerOpen={drawerOpen} collapsed={!drawerOpen} />,
    [user, drawerOpen]
  );

  const settings = useSettings();

  const pageTitle = useMemo(() => {
    const path = location.pathname.toLowerCase();
    const routes = [
      ["/tickets", "Atendimento"],
      ["/contacts", "Contatos"],
      ["/quick-messages", "Respostas rápidas"],
      ["/schedules", "Agenda"],
      ["/flowbuilder", "Flow Builder"],
      ["/campaign", "Campanhas"],
      ["/connections", "Conexões"],
      ["/reports", "Relatórios"],
      ["/settings", "Configurações"],
      ["/users", "Equipe"],
      ["/queues", "Filas"],
      ["/financeiro", "Financeiro"],
      ["/kanban", "Kanban"],
      ["/chats", "Chat interno"],
      ["/files", "Arquivos"],
      ["/prompts", "Prompts e IA"],
      ["/companies", "Empresas"],
    ];
    const match = routes.find(([route]) => path.startsWith(route));
    return match ? match[1] : "Central operacional";
  }, [location.pathname]);

  useEffect(() => {
    const getSetting = async () => {
      const response = await settings.get("wtV");


      if (response) {

        setUserToken("disabled");

      } else {
        setUserToken("disabled");
      }
    };

    getSetting();
  });

  

  useEffect(() => {
    // if (localStorage.getItem("public-token") === null) {
    //   handleLogout()
    // }

    if (document.body.offsetWidth > 600) {
      if (user.defaultMenu === "closed") {
        setDrawerOpen(false);
      } else {
        setDrawerOpen(true);
      }
    }
    if (user.defaultTheme === "dark" && theme.mode === "light") {
      colorMode.toggleColorMode();
    }
  }, [user.defaultMenu, document.body.offsetWidth]);

  useEffect(() => {
    if (document.body.offsetWidth < 600) {
      setDrawerVariant("temporary");
    } else {
      setDrawerVariant("permanent");
    }
  }, [drawerOpen]);

  useEffect(() => {

    const companyId = user.companyId;
    const userId = user.id;
    if (companyId) {
      //    const socket = socketManager.GetSocket();

      const ImageUrl = user.profileImage;
      if (ImageUrl !== undefined && ImageUrl !== null)
      setProfileUrl(`${backendUrl}/public/avatar/${ImageUrl}`);
      else setProfileUrl(`${process.env.FRONTEND_URL}/nopicture.png`);

      const onCompanyAuthLayout = (data) => {
        if (data.user.id === +userId) {
          toastError("Sua conta foi acessada em outro computador.");
          setTimeout(() => {
            localStorage.clear();
            window.location.reload();
          }, 1000);
        }
      }

      socket.on(`company-${companyId}-auth`, onCompanyAuthLayout);

      socket.emit("userStatus");
      const interval = setInterval(() => {
        socket.emit("userStatus");
      }, 1000 * 60 * 5);

      return () => {
        socket.off(`company-${companyId}-auth`, onCompanyAuthLayout);
        clearInterval(interval);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuOpen(false);
  };

  const handleOpenUserModal = () => {
    setUserModalOpen(true);
    handleCloseMenu();
  };

  const handleClickLogout = () => {
    handleCloseMenu();
    handleLogout();
  };

  const drawerClose = () => {
    if (document.body.offsetWidth < 600 || user.defaultMenu === "closed") {
      setDrawerOpen(false);
    }
  };

  const handleRefreshPage = () => {
    window.location.reload(false);
  };

  const handleMenuItemClick = () => {
    const { innerWidth: width } = window;
    if (width <= 600) {
      setDrawerOpen(false);
    }
  };

  if (loading) {
    return <BackdropLoading />;
  }

  return (
    <div className={classes.root}>
      <Drawer
        variant={drawerVariant}
        className={drawerOpen ? classes.drawerPaper : classes.drawerPaperClose}
        classes={{
          paper: clsx(
            classes.drawerPaper,
            !drawerOpen && classes.drawerPaperClose
          ),
        }}
        open={drawerOpen}
      >
        <div className={classes.toolbarIcon}>
          <img className={drawerOpen ? classes.logo : classes.hideLogo}
            style={{
              display: "block",
              margin: 0,
            }}
            alt="logo" />
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <List className={classes.containerWithScroll}>
          {/* {mainListItems} */}
          <MainListItems collapsed={!drawerOpen} />
        </List>
        <Divider />
      </Drawer>

      <AppBar
        position="absolute"
        className={clsx(classes.appBar, drawerOpen && classes.appBarShift)}
        color="primary"
      >
        <Toolbar variant="dense" className={classes.toolbar}>
          <IconButton
            edge="start"
            variant="contained"
            aria-label="open drawer"
            color="inherit"
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={clsx(drawerOpen && classes.menuButtonHidden)}
          >
            <MenuIcon />
          </IconButton>

          <div className={classes.pageContext}>
            <span className={classes.signalMark} />
            <Typography component="h1" noWrap className={classes.title}>
              {pageTitle}
              {greaterThenSm && (
                <span className={classes.companyContext}>{user?.company?.name}</span>
              )}
            </Typography>
          </div>

          {userToken === "enabled" && user?.companyId === 1 && (
            <Chip
              className={classes.chip}
              label={i18n.t("mainDrawer.appBar.user.token")}
            />
          )}
          <span className={classes.toolbarSecondary}><VersionControl /></span>

          {/* DESABILITADO POIS TEM BUGS */}
          <span className={classes.toolbarSecondary}><UserLanguageSelector /></span>
          {/* <SoftPhone
            callVolume={33} //Set Default callVolume
            ringVolume={44} //Set Default ringVolume
            connectOnStart={false} //Auto connect to sip
            notifications={false} //Show Browser Notification of an incoming call
            config={config} //Voip config
            setConnectOnStartToLocalStorage={setConnectOnStartToLocalStorage} // Callback function
            setNotifications={setNotifications} // Callback function
            setCallVolume={setCallVolume} // Callback function
            setRingVolume={setRingVolume} // Callback function
            timelocale={'UTC-3'} //Set time local for call history
          /> */}
          <IconButton className={classes.toolbarSecondary} onClick={colorMode.toggleColorMode}>
            {theme.mode === "dark" ? (
              <Brightness7Icon />
            ) : (
              <Brightness4Icon />
            )}
          </IconButton>

          <span className={classes.toolbarSecondary}><NotificationsVolume setVolume={setVolume} volume={volume} /></span>

          <IconButton
            onClick={handleRefreshPage}
            aria-label={i18n.t("mainDrawer.appBar.refresh")}
            color="inherit"
            className={classes.toolbarSecondary}
          >
            <CachedIcon />
          </IconButton>

          {/* <DarkMode themeToggle={themeToggle} /> */}

          {user.id && <NotificationsPopOver volume={volume} />}

          <AnnouncementsPopover />

          <ChatPopover />

          <div>
            <StyledBadge
              className={classes.accountButton}
              overlap="circular"
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              variant="dot"
              onClick={handleMenu}
            >
              <Avatar
                alt="Multi100"
                className={classes.avatar2}
                src={profileUrl}
              />
            </StyledBadge>

            <UserModal
              open={userModalOpen}
              onClose={() => setUserModalOpen(false)}
              onImageUpdate={(newProfileUrl) => setProfileUrl(newProfileUrl)}
              userId={user?.id}
            />

            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={menuOpen}
              onClose={handleCloseMenu}
            >
              <MenuItem onClick={handleOpenUserModal}>
                {i18n.t("mainDrawer.appBar.user.profile")}
              </MenuItem>
              <MenuItem onClick={handleClickLogout}>
                {i18n.t("mainDrawer.appBar.user.logout")}
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      <main className={classes.content}>
        <div className={classes.appBarSpacer} />

        {children ? children : null}
      </main>
    </div>
  );
};

export default LoggedInLayout;
