import React from "react";

import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(theme => ({
	MainHeaderButtonsWrapper: {
		display: "flex",
		flex: "none",
		alignItems: "center",
		justifyContent: "flex-end",
		flexWrap: "wrap",
		gap: theme.spacing(1),
		marginLeft: "auto",
		"& > *": {
			margin: 0,
		},
		[theme.breakpoints.down("xs")]: {
			width: "100%",
			justifyContent: "flex-start",
			marginLeft: 0,
			"& > button": {
				minHeight: 40,
			},
		},
	},
}));

const MainHeaderButtonsWrapper = ({ children }) => {
	const classes = useStyles();

	return <div className={classes.MainHeaderButtonsWrapper}>{children}</div>;
};

export default MainHeaderButtonsWrapper;
