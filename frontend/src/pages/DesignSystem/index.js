import React, { useState } from "react";
import {
  Button,
  Input,
  Card,
  Badge,
  StatusDot,
  Table,
  Avatar,
  EmptyState,
} from "../../design-system/primitives";
import "./designSystem.css";

/**
 * Referência viva do design system (ADR-0004).
 *
 * Serve a dois propósitos concretos:
 * 1. provar que os primitivos renderizam com os tokens reais, em claro e
 *    escuro, sem depender de Material UI;
 * 2. dar uma superfície única para julgar a direção visual antes de migrar as
 *    44 telas — a ausência disso foi o que deixou os redesigns anteriores
 *    serem avaliados só depois de prontos, quando corrigir já custava caro.
 */

const Section = ({ title, note, children }) => (
  <section className="dsref__section">
    <header className="dsref__section-head">
      <h2 className="dsref__section-title">{title}</h2>
      {note && <p className="dsref__section-note">{note}</p>}
    </header>
    <div className="dsref__section-body">{children}</div>
  </section>
);

const Swatch = ({ token, label }) => (
  <div className="dsref__swatch">
    <div className="dsref__swatch-chip" style={{ background: `var(--${token})` }} />
    <div className="dsref__swatch-meta">
      <span className="dsref__swatch-label">{label}</span>
      <code className="dsref__swatch-token">--{token}</code>
    </div>
  </div>
);

const TICKETS = [
  { id: 4821, nome: "Marina Alves", canal: "WhatsApp", fila: "Suporte", estado: "live", rotulo: "Aberto", espera: "2 min", ultima: "Bom dia, consegui o boleto?" },
  { id: 4820, nome: "Carlos Prado", canal: "WhatsApp", fila: "Vendas", estado: "wait", rotulo: "Pendente", espera: "14 min", ultima: "Vou verificar com o financeiro" },
  { id: 4819, nome: "Juliana Reis", canal: "WhatsApp", fila: "Suporte", estado: "fail", rotulo: "Falha no envio", espera: "31 min", ultima: "Mensagem nao entregue" },
  { id: 4818, nome: "Pedro Nogueira", canal: "WhatsApp", fila: "Financeiro", estado: "off", rotulo: "Fechado", espera: "—", ultima: "Obrigado, resolvido" },
];

const DesignSystemPage = () => {
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState("");

  return (
    <div className="dsref ds-root">
      <header className="dsref__head">
        <div>
          <h1 className="dsref__title">Design System</h1>
          <p className="dsref__subtitle">
            Referência viva dos tokens e primitivos. Alterne o tema pelo menu do
            CRM: tudo abaixo acompanha, porque nada aqui tem cor fixa.
          </p>
        </div>
      </header>

      <Section
        title="Superfícies e texto"
        note="A escala neutra é fria e de baixa saturação para não competir com os sinais de status."
      >
        <div className="dsref__swatches">
          <Swatch token="surface-page" label="Página" />
          <Swatch token="surface-raised" label="Elevada" />
          <Swatch token="surface-sunken" label="Recuada" />
          <Swatch token="text-primary" label="Texto principal" />
          <Swatch token="text-secondary" label="Texto secundário" />
          <Swatch token="text-muted" label="Texto discreto" />
          <Swatch token="border-subtle" label="Borda sutil" />
          <Swatch token="border-input" label="Borda de controle" />
        </div>
      </Section>

      <Section
        title="Marca e sinais"
        note="A cor de marca é substituível por tenant. Os sinais não são: verde é conexão viva, âmbar é espera, vermelho exige ação. São semântica de produto, não identidade de cliente."
      >
        <div className="dsref__swatches">
          <Swatch token="brand-base" label="Marca" />
          <Swatch token="brand-soft" label="Marca suave" />
          <Swatch token="signal-live" label="Vivo / conectado" />
          <Swatch token="signal-wait" label="Espera" />
          <Swatch token="signal-fail" label="Falha" />
          <Swatch token="signal-info" label="Informação" />
        </div>
      </Section>

      <Section title="Estado de conexão" note="O halo pulsante distingue 'conectado agora' de 'estava conectado quando a página carregou'. Respeita prefers-reduced-motion.">
        <div className="dsref__row">
          <StatusDot tone="live" label="Conectado" />
          <StatusDot tone="wait" label="Conectando" />
          <StatusDot tone="fail" label="Desconectado" />
          <StatusDot tone="off" label="Inativo" />
        </div>
      </Section>

      <Section title="Ações">
        <div className="dsref__row">
          <Button variant="primary">Salvar</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="ghost">Ver detalhes</Button>
          <Button variant="destructive">Excluir</Button>
          <Button variant="primary" disabled>
            Indisponível
          </Button>
        </div>
        <div className="dsref__row">
          <Button size="sm">Pequeno</Button>
          <Button size="md">Médio</Button>
          <Button size="lg">Grande</Button>
        </div>
      </Section>

      <Section title="Entrada de dados">
        <div className="dsref__grid2">
          <Input
            label="Buscar contato"
            name="busca"
            placeholder="Nome ou número"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Input
            label="Número com erro"
            name="numero"
            placeholder="5511999999999"
            error={erro}
            onChange={(e) => setErro(e.target.value.length < 12 ? "Informe o DDI e o DDD." : "")}
          />
        </div>
      </Section>

      <Section title="Rótulos de estado">
        <div className="dsref__row">
          <Badge tone="live">Entregue</Badge>
          <Badge tone="wait">Pendente</Badge>
          <Badge tone="fail">Falhou</Badge>
          <Badge tone="info">Agendado</Badge>
          <Badge tone="brand">Campanha</Badge>
          <Badge tone="neutral">Fechado</Badge>
        </div>
      </Section>

      <Section
        title="Lista operacional"
        note="Densidade alta de propósito: linha de 40px, fonte de 13px, cabeçalho fixo. O que importa numa fila de atendimento é quantos tickets cabem sem rolar."
      >
        <Card>
          <Card.Header title="Atendimentos">
            <Button size="sm" variant="secondary">
              Filtrar
            </Button>
          </Card.Header>
          <Card.Body flush>
            <Table clickable>
              <thead>
                <tr>
                  <th>Contato</th>
                  <th>Fila</th>
                  <th>Estado</th>
                  <th>Espera</th>
                  <th>Última mensagem</th>
                </tr>
              </thead>
              <tbody>
                {TICKETS.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="dsref__contact">
                        <Avatar name={t.nome} size="sm" />
                        <div className="ds-truncate">
                          <div className="dsref__contact-name">{t.nome}</div>
                          <div className="dsref__contact-id">#{t.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{t.fila}</td>
                    <td>
                      <StatusDot tone={t.estado} label={t.rotulo} />
                    </td>
                    <td>{t.espera}</td>
                    <td className="dsref__last ds-truncate">{t.ultima}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Section>

      <Section title="Estado vazio">
        <Card>
          <Card.Body>
            <EmptyState
              title="Nenhum atendimento na fila"
              hint="Quando um contato enviar mensagem, o ticket aparece aqui automaticamente."
              action={<Button size="sm">Abrir conexões</Button>}
            />
          </Card.Body>
        </Card>
      </Section>
    </div>
  );
};

export default DesignSystemPage;
