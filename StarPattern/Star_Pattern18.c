#include <stdio.h>
int main()//ลูกศรชี้ทางทิศตะวันตกเฉียงเหนือ//
{
    int n,i,j;
    scanf("%d",&n);
    for(i=0;i<=n/2;i++)
    {
        for(j=0;j<n-i;j++) printf("* ");
        printf("\n");
    }
    for(i=(n/2)+1;i<n;i++)
    {
        for(j=0;j<n-i;j++) printf("* ");
        for(j=2;j<2*(i-(n/2))+1;j++) printf("  ");
        printf("*");
        printf("\n");
    }
}