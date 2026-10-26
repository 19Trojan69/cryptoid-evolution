// Local WPE attribution only. Snapshot glibc counters; never trim, collect,
// replace malloc/free, change allocator settings or enter the game's runtime.
#define _GNU_SOURCE
#include <dlfcn.h>
#include <fcntl.h>
#include <malloc.h>
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/prctl.h>
#include <time.h>
#include <unistd.h>

static int output = -1;
static void *observe(void *unused) {
  (void)unused;
  const char *stop_path = getenv("CRYPTOID_HEAPTRACK_STOP_FILE");
  int stopped = 0;
  struct timespec delay = { .tv_sec = 0, .tv_nsec = 500000000 };
  for (int sample = 0; sample < 600; sample++) {
    char role[17] = {0}, line[512]; struct timespec clock;
    prctl(PR_GET_NAME, role); clock_gettime(CLOCK_MONOTONIC, &clock);
    if (stop_path && !stopped && !access(stop_path, F_OK)) {
      void (*stop)(void) = (void (*)(void))dlsym(RTLD_DEFAULT, "heaptrack_stop");
      if (stop) { stop(); stopped = 1; }
    }
    struct mallinfo2 info = mallinfo2();
    if (!strcmp(role, "WPEWebProcess") || !strcmp(role, "WPENetworkProce") || !strcmp(role, "MiniBrowser")) {
      int length = snprintf(line, sizeof line,
        "{\"role\":\"%s\",\"monotonicMs\":%lld,\"arena\":%zu,\"allocatedArena\":%zu,\"freeArena\":%zu,\"mmappedBytes\":%zu,\"freeChunks\":%zu,\"topFree\":%zu,\"heaptrackStopped\":%s}\n",
        role, (long long)clock.tv_sec * 1000 + clock.tv_nsec / 1000000,
        info.arena, info.uordblks, info.fordblks, info.hblkhd, info.ordblks, info.keepcost, stopped ? "true" : "false");
      if (length > 0 && (size_t)length < sizeof line) {
        ssize_t written = write(output, line, (size_t)length); (void)written;
      }
    }
    nanosleep(&delay, NULL);
  }
  return NULL;
}

__attribute__((constructor)) static void start_observer(void) {
  const char *path = getenv("CRYPTOID_MALLINFO_FILE");
  if (!path || strncmp(path, "/workspace/scratch/", 19) || !strstr(path, "/verification/rebuild/")) return;
  // The runner must have exclusively reserved the log. No other file is opened.
  output = open(path, O_WRONLY | O_APPEND | O_CLOEXEC | O_NOFOLLOW);
  if (output < 0) return;
  pthread_t thread;
  if (!pthread_create(&thread, NULL, observe, NULL)) pthread_detach(thread);
}
