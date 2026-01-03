import { Job } from '@rlanz/bull-queue'

interface TestJobPayload {
  
}

export default class TestJob extends Job {
  // This is the path to the file that is used to create the job
  static get $$filepath() {
    return import.meta.url
  }

  /**
   * Base Entry point
   */
  // @ts-ignore
  async handle(payload: TestJobPayload) {}

  /**
   * This is an optional method that gets called when the retries has exceeded and is marked failed.
   */
  // @ts-ignore
  async rescue(payload: TestJobPayload) {}
}