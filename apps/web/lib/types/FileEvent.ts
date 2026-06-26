import { ChangeEvent } from "react";

export interface FileEvent<T = Element> extends ChangeEvent<T> {
  target: EventTarget & T;
}
