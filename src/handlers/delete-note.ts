interface RequestPayload {
  data: {
    prompt: string;
    width: string;
    height: string;
    style: string;
  };
}

export default async function DeleteNote(req: RequestPayload): Promise<RequestPayload> {
  return req;
}
