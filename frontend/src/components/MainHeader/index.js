import React from "react";

import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(theme => ({
	contactsHeader: {
		display: "flex",
		alignItems: "center",
		gap: theme.spacing(2),
		minHeight: 52,
		padding: theme.spacing(0, 0.5, 1.5),
		borderBottom: `1px solid ${theme.palette.divider}`,
		marginBottom: theme.spacing(2),
		flexShrink: 0,
		[theme.breakpoints.down("xs")]: {
			position: "sticky",
			top: 0,
			zIndex: 5,
			alignItems: "center",
			flexWrap: "nowrap",
			gap: theme.spacing(1),
			minHeight: "auto",
			padding: theme.spacing(1, 0, 1.25),
			marginBottom: theme.spacing(1.5),
			backgroundColor: theme.palette.background.default,
		},
	},
}));

const MainHeader = ({ children }) => {
	const classes = useStyles();

	return <div className={classes.contactsHeader}>{children}</div>;
};

export default MainHeader;
