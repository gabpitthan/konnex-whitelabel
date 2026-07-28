import React from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
	paper: {
		width: "100%",
		maxWidth: 440,
		maxHeight: "min(560px, calc(100dvh - 32px))",
		display: "flex",
		flexDirection: "column",
		overflow: "hidden",
		borderRadius: 12,
		boxShadow: "0 20px 55px rgba(15, 23, 42, 0.18)",
		[theme.breakpoints.down("xs")]: {
			width: `calc(100% - ${theme.spacing(3)}px)`,
			maxHeight: "calc(100dvh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
			margin: theme.spacing(1.5),
			borderRadius: 10,
		},
	},
	title: {
		padding: theme.spacing(2.5, 3, 1),
		"& h2": {
			color: theme.palette.text.primary,
			fontSize: "1.15rem",
			fontWeight: 700,
			lineHeight: 1.35,
			letterSpacing: "-0.015em",
		},
		[theme.breakpoints.down("xs")]: {
			padding: theme.spacing(2, 2, 0.75),
		},
	},
	content: {
		padding: theme.spacing(1.5, 3, 2.5),
		border: 0,
		color: theme.palette.text.secondary,
		minHeight: 0,
		overflowY: "auto",
		overscrollBehavior: "contain",
		WebkitOverflowScrolling: "touch",
		[theme.breakpoints.down("xs")]: {
			padding: theme.spacing(1.25, 2, 2),
		},
	},
	message: {
		fontSize: "0.925rem",
		lineHeight: 1.6,
	},
	actions: {
		flexShrink: 0,
		gap: theme.spacing(1),
		padding: theme.spacing(1.5, 3, 2.5),
		backgroundColor: theme.palette.background.paper,
		"& > :not(:first-child)": {
			marginLeft: 0,
		},
		[theme.breakpoints.down("xs")]: {
			padding: `8px 16px calc(12px + env(safe-area-inset-bottom))`,
			"& button": {
				flex: 1,
				minHeight: 42,
			},
		},
	},
	button: {
		minHeight: 38,
		borderRadius: 7,
		padding: theme.spacing(0.75, 2),
		fontWeight: 600,
		textTransform: "none",
		boxShadow: "none",
	},
}));

const ConfirmationModal = ({ title, children, open, onClose, onConfirm }) => {
	const classes = useStyles();

	return (
		<Dialog
			open={open}
			onClose={() => onClose(false)}
			aria-labelledby="confirm-dialog"
			fullWidth
			maxWidth="xs"
			PaperProps={{ className: classes.paper }}
		>
			<DialogTitle id="confirm-dialog" className={classes.title}>
				{title}
			</DialogTitle>
			<DialogContent dividers className={classes.content}>
				<Typography className={classes.message}>{children}</Typography>
			</DialogContent>
			<DialogActions className={classes.actions}>
				<Button
					variant="contained"
					onClick={() => onClose(false)}
					color="default"
					className={classes.button}
				>
					{i18n.t("confirmationModal.buttons.cancel")}
				</Button>
				<Button
					variant="contained"
					onClick={() => {
						onClose(false);
						onConfirm();
					}}
					color="secondary"
					className={classes.button}
				>
					{i18n.t("confirmationModal.buttons.confirm")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ConfirmationModal;
