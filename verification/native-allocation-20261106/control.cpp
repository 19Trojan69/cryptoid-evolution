#include <cstdlib>
#include <cstdio>
#include <unistd.h>
__attribute__((noinline)) void known_heap_owner(){
 const size_t n=4*1024*1024;volatile unsigned char* p=(volatile unsigned char*)std::malloc(n);
 if(!p)std::abort();for(size_t i=0;i<n;i+=4096)p[i]=7;
 ::usleep(250000);std::printf("%u\n",(unsigned)p[0]);std::free((void*)p);
}
int main(){known_heap_owner();return 0;}
