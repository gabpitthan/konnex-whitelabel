import React from "react";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import Skeleton from "@material-ui/lab/Skeleton";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
	customTableCell: {
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-start",
		width: "100%",
	},
	row: {
		height: 58,
	},
	skeleton: {
		borderRadius: 5,
		backgroundColor:
			theme.palette.type === "dark"
				? "rgba(255,255,255,0.08)"
				: "rgba(15,23,42,0.08)",
	},
	avatarCell: {
		width: 56,
		paddingRight: 0,
	},
}));

const TableRowSkeleton = ({ avatar, columns }) => {
	const classes = useStyles();
	return (
		<>
			<TableRow className={classes.row}>
				{avatar && (
					<>
						<TableCell className={classes.avatarCell}>
							<Skeleton
								animation="wave"
								variant="circle"
								width={40}
								height={40}
								className={classes.skeleton}
							/>
						</TableCell>
						<TableCell>
							<Skeleton
								animation="wave"
								height={24}
								width="70%"
								className={classes.skeleton}
							/>
						</TableCell>
					</>
				)}
				{Array.from({ length: columns }, (_, index) => (
					<TableCell align="center" key={index}>
						<div className={classes.customTableCell}>
							<Skeleton
								animation="wave"
								height={22}
								width={`${58 + (index % 3) * 12}%`}
								className={classes.skeleton}
							/>
						</div>
					</TableCell>
				))}
			</TableRow>
		</>
	);
};

export default TableRowSkeleton;
