import React from "react";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(theme => ({
	title: {
		flex: "1 1 auto",
		minWidth: 0,
		margin: 0,
		color: theme.palette.text.primary,
		fontSize: "1.35rem",
		fontWeight: 700,
		lineHeight: 1.25,
		letterSpacing: "-0.025em",
		[theme.breakpoints.down("xs")]: {
			width: "100%",
			fontSize: "1.2rem",
		},
	},
}));

export default function Title({ children, className, ...props }) {
	const classes = useStyles();

	return (
		<Typography
			variant="h5"
			component="h1"
			className={`${classes.title} ${className || ""}`}
			{...props}
		>
			{children}
		</Typography>
	);
}
