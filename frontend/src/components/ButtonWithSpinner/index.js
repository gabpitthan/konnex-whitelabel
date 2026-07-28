import React from "react";

import { makeStyles } from "@material-ui/core/styles";
import { CircularProgress, Button } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
	button: {
		position: "relative",
		minHeight: 38,
		borderRadius: 7,
		padding: theme.spacing(0.875, 2),
		fontWeight: 600,
		letterSpacing: 0,
		textTransform: "none",
		boxShadow: "none",
		transition: theme.transitions.create(
			["background-color", "border-color", "box-shadow", "transform"],
			{ duration: theme.transitions.duration.shorter }
		),
		"&:active": {
			transform: "translateY(1px)",
		},
		"&.MuiButton-contained:hover": {
			boxShadow: "none",
		},
	},

	buttonProgress: {
		color: "currentColor",
		position: "absolute",
		top: "50%",
		left: "50%",
		marginTop: -12,
		marginLeft: -12,
	},

	loadingContent: {
		visibility: "hidden",
	},
}));

const ButtonWithSpinner = ({ loading, children, ...rest }) => {
	const classes = useStyles();

	return (
		<Button className={classes.button} disabled={loading} {...rest}>
			<span className={loading ? classes.loadingContent : undefined}>
				{children}
			</span>
			{loading && (
				<CircularProgress size={24} className={classes.buttonProgress} />
			)}
		</Button>
	);
};

export default ButtonWithSpinner;
