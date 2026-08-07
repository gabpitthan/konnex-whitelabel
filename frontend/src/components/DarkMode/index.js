import React, { useState } from "react";

import { makeStyles } from "@material-ui/core/styles";
import { CssBaseline, IconButton } from "@material-ui/core";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";

const useStyles = makeStyles((theme) => ({
    icons: {
        color: "var(--text-inverse)",
    },
    switch: {
        color: "var(--text-inverse)",
    },
    visible: {
        display: "none",
    },
    btnHeader: {
        color: "var(--text-inverse)",
    },
}));

const DarkMode = (props) => {
    const classes = useStyles();

    const [theme, setTheme] = useState("light");

    const themeToggle = () => {
        theme === "light" ? setTheme("dark") : setTheme("light");
    };

    const handleClick = () => {
        props.themeToggle();
        themeToggle();
    };

    return (
        <>
            {theme === "light" ? (
                <>
                    <CssBaseline />
                    <IconButton
                        className={classes.icons}
                        onClick={handleClick}
                        // ref={anchorEl}
                        aria-label="Dark Mode"
                        color="inherit"
                    >
                        <Brightness4Icon />
                    </IconButton>
                </>
            ) : (
                <>
                    <CssBaseline />
                    <IconButton
                        className={classes.icons}
                        onClick={handleClick}
                        // ref={anchorEl}
                        aria-label="Dark Mode"
                        color="inherit"
                    >
                        <Brightness7Icon />
                    </IconButton>
                </>
            )}
        </>
    );
};

export default DarkMode;
