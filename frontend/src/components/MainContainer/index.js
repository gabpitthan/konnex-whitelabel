import React from "react";

import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";

const useStyles = makeStyles(theme => ({
	mainContainer: {
		flex: 1,
		width: "100%",
		maxWidth: "none",
		padding: theme.spacing(2.5, 3),
		height: `calc(100% - 48px)`,
		minHeight: 0,
		backgroundColor: theme.palette.background.default,
		[theme.breakpoints.down("sm")]: {
			padding: theme.spacing(2),
		},
		[theme.breakpoints.down("xs")]: {
			height: `calc(100% - 56px)`,
			padding: theme.spacing(1.5),
		},
	},

	contentWrapper: {
		height: "100%",
		minHeight: 0,
		width: "100%",
		overflowY: "hidden",
		display: "flex",
		flexDirection: "column",
	},
}));

const MainContainer = ({ children }) => {
	const classes = useStyles();

	return (
		<Container maxWidth={false} className={classes.mainContainer}>
			<div className={classes.contentWrapper}>{children}</div>
		</Container>
	);
};

export default MainContainer;
