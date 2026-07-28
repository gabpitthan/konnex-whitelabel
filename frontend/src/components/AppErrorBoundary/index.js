import React from "react";
import { reportClientError } from "../../services/clientErrorReporter";
import "./styles.css";

class AppErrorBoundary extends React.Component {
	state = { hasError: false, errorId: "" };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch(error, errorInfo) {
		const component = String(errorInfo?.componentStack || "")
			.split("\n")
			.slice(0, 5)
			.join(" ");
		const errorId = reportClientError(error, { kind: "react", component });
		this.setState({ errorId });
	}

	handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(this.state.errorId);
		} catch (_) {
			// The identifier remains selectable if clipboard permission is unavailable.
		}
	};

	render() {
		if (!this.state.hasError) return this.props.children;

		return (
			<main className="kx-error-page" role="alert">
				<section className="kx-error-panel">
					<div className="kx-error-signal" aria-hidden="true" />
					<p className="kx-error-eyebrow">KONNEX · RECUPERAÇÃO</p>
					<h1>Algo interrompeu esta tela.</h1>
					<p className="kx-error-description">
						O erro foi identificado com segurança. Você pode recarregar o sistema ou
						voltar ao acesso sem perder o identificador do diagnóstico.
					</p>
					<div className="kx-error-id">
						<span>ID do erro</span>
						<strong>{this.state.errorId || "Gerando…"}</strong>
						<button type="button" onClick={this.handleCopy}>
							Copiar ID
						</button>
					</div>
					<div className="kx-error-actions">
						<button type="button" className="kx-error-primary" onClick={() => window.location.reload()}>
							Recarregar
						</button>
						<button type="button" onClick={() => window.location.assign("/login")}>
							Voltar ao login
						</button>
					</div>
				</section>
			</main>
		);
	}
}

export default AppErrorBoundary;

