import { Controller } from "@nestjs/common";
import { FilesService } from "./files.service";
import { ApiFilesTags } from "./files.swagger";

@ApiFilesTags()
@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}
}
