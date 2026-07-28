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
			minWidth: 0,
			maxWidth: "62%",
			flexWrap: "nowrap",
			justifyContent: "flex-end",
			overflowX: "auto",
			overscrollBehaviorX: "contain",
			WebkitOverflowScrolling: "touch",
			scrollbarWidth: "none",
			"&::-webkit-scrollbar": {
				display: "none",
			},
			"& > *": {
				flex: "0 0 auto",
			},
			"& > button, & > * > button": {
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
