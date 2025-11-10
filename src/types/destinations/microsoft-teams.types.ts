export type MicrosoftTeamsColor = "default" | "dark" | "light" | "accent" | "good" | "warning" | "attention";

export type MicrosoftTeamsAction = {
  type: string;
  title: string;
  url: string;
};

export type MicrosoftTeamsFact = {
  title: string;
  value: string;
};

export type MicrosoftTeamsBodyItem = {
  type: string;
  spacing?: string;
  separator?: boolean;
  facts?: MicrosoftTeamsFact[];
  text?: string;
  wrap?: boolean;
  maxLines?: number;
  fontType?: string;
  size?: string;
  weight?: string;
  color?: string;
  actions?: MicrosoftTeamsAction[];
};

export type MicrosoftTeamsLink = {
  title: string;
  url: string;
};

export type MicrosoftTeamsPayload = {
  type: string;
  attachments: {
    contentType: string;
    contentUrl: null;
    content: {
      type: string;
      speak: string;
      $schema: string;
      version: string;
      msteams: { width: string };
      body: MicrosoftTeamsBodyItem[];
    };
  }[];
};
